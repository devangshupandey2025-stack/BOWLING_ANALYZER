import express from "express";
import multer from "multer";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, createPartFromUri } from "@google/genai";

dotenv.config({ quiet: true });

/* ─── Paths & constants ─────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const PORT           = parseInt(process.env.PORT || "3000", 10);
const HOST           = process.env.HOST || "0.0.0.0";
const TEMP_DIR       = path.join(process.cwd(), ".tmp-uploads");
const MAX_FILE_BYTES = 250 * 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = parseInt(process.env.RATE_LIMIT || "10", 10);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4", "video/quicktime", "video/x-msvideo",
  "video/webm", "video/x-matroska", "video/mpeg", "video/3gpp",
]);

/* ─── Boot-time setup ───────────────────────────────── */
await fs.mkdir(TEMP_DIR, { recursive: true });

// Purge leftover temp files from previous interrupted runs
const staleFiles = await fs.readdir(TEMP_DIR).catch(() => []);
await Promise.allSettled(staleFiles.map(f => fs.unlink(path.join(TEMP_DIR, f))));

/* ─── Multer with file-type validation ──────────────── */
const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_VIDEO_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Unsupported file type "${file.mimetype}". Please upload a video.`));
  },
});

const REQUIRED_SECTIONS = [
  "1. Action Overview",
  "2. Observed Technical Points",
  "3. Performance & Risk Implications",
  "4. Coaching Cues & Focus Areas",
  "5. Disclaimer"
];

const COACH_PROMPT = `
You are an elite-level cricket fast bowling coach assisting professional academy players.

Your task is to analyze a recorded SIDE-ON fast bowling action video and provide QUALITATIVE, COACH-STYLE FEEDBACK only.

IMPORTANT CONSTRAINTS:
- Do NOT perform numerical biomechanical analysis.
- Do NOT invent joint angles, forces, or medical diagnoses.
- Do NOT give rehabilitation or medical advice.
- Use conservative, non-prescriptive language (e.g., "may indicate", "often associated with").
- Your role is to support coaching, not replace a human coach.

ANALYSIS SCOPE:
Focus only on visually observable coaching cues from a side-on view, including:
- Overall action type (side-on, front-on, mixed)
- Timing relationships (arm rotation vs front-foot contact)
- Balance and stability (head position, falling away, alignment)
- Front knee behavior at release
- Non-bowling arm usage
- Smoothness and control through release and follow-through

DETECTION PRIORITIES:
Pay particular attention to these known fast-bowling issues:
1. Mixed bowling action and its potential lumbar stress implications
2. Front knee collapsing at or after front-foot contact
3. Early collapse or pulling down of the non-bowling arm

OUTPUT STRUCTURE (MANDATORY):
Your response MUST follow this structure exactly:

1. Action Overview
   - Brief summary of the observed bowling action and overall flow.

2. Observed Technical Points
   - Bullet-point list of detected issues or strengths.
   - Reference approximate action phases (e.g., "around front-foot contact", "near release").

3. Performance & Risk Implications
   - Explain how the observed points may affect pace, control, or long-term load.
   - Keep explanations qualitative and cautious.

4. Coaching Cues & Focus Areas
   - Short, actionable coaching cues a bowler could work on with a coach.
   - No drills requiring equipment or medical intervention.

5. Disclaimer
   - Clearly state that this feedback is informational and should be reviewed with a qualified coach.

TONE & STYLE:
- Professional, calm, and coach-like
- Clear and concise
- Encouraging but honest
- No emojis, no slang, no hype language

If the video quality or angle limits certainty, explicitly state that limitations may affect accuracy.

Return plain text only.
`;

/* ─── Express app ───────────────────────────────────── */
const app = express();

// Trust the first proxy (Nginx, Cloudflare, cloud LB)
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Gzip / Brotli compression
app.use(compression());

// Simple in-memory rate limiter (per IP)
const hitCounts = new Map();
setInterval(() => hitCounts.clear(), RATE_WINDOW_MS).unref();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const count = (hitCounts.get(ip) || 0) + 1;
  hitCounts.set(ip, count);
  res.setHeader("X-RateLimit-Limit", String(RATE_MAX));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, RATE_MAX - count)));
  if (count > RATE_MAX) {
    return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
  }
  next();
}

app.use(express.json({ limit: "1mb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    etag: true,
  })
);

function getResponseText(response) {
  if (!response) return "";
  if (typeof response.text === "function") return response.text();
  if (typeof response.text === "string") return response.text;
  const firstCandidate = response.candidates?.[0];
  const parts = firstCandidate?.content?.parts || [];
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function hasRequiredStructure(text) {
  return REQUIRED_SECTIONS.every((section) => text.includes(section));
}

function fallbackStructuredResponse() {
  return `1. Action Overview
   - A reliable action summary could not be generated from the current model response.

2. Observed Technical Points
   - Visual cues could not be extracted with enough confidence from this run.

3. Performance & Risk Implications
   - Because observations were limited, performance or loading implications remain uncertain.

4. Coaching Cues & Focus Areas
   - Re-check video quality and side-on alignment, then re-run analysis with a shorter, clearer clip.

5. Disclaimer
   - This feedback is informational and should be reviewed with a qualified cricket coach.
`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFileReady(ai, fileName) {
  let file = await ai.files.get({ name: fileName });
  const start = Date.now();
  const timeoutMs = 180000;

  while (file.state === "PROCESSING") {
    if (Date.now() - start > timeoutMs) {
      throw new Error("Video processing timed out. Try a shorter clip.");
    }
    await sleep(1500);
    file = await ai.files.get({ name: file.name });
  }

  if (file.state === "FAILED") {
    throw new Error("Gemini failed to process this video file.");
  }

  return file;
}

async function reformatToRequiredStructure(ai, model, rawText) {
  const prompt = `
Reformat the coaching feedback below so it exactly matches this structure and nothing else:

1. Action Overview
   - Brief summary of the observed bowling action and overall flow.

2. Observed Technical Points
   - Bullet-point list of detected issues or strengths.
   - Reference approximate action phases (e.g., "around front-foot contact", "near release").

3. Performance & Risk Implications
   - Explain how the observed points may affect pace, control, or long-term load.
   - Keep explanations qualitative and cautious.

4. Coaching Cues & Focus Areas
   - Short, actionable coaching cues a bowler could work on with a coach.
   - No drills requiring equipment or medical intervention.

5. Disclaimer
   - Clearly state that this feedback is informational and should be reviewed with a qualified coach.

Rules:
- Do not add numerical biomechanics, medical diagnosis, or rehab advice.
- Do not invent new observations beyond the text provided.
- Keep language conservative.
- Return plain text only.

Source text:
${rawText}
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt
  });
  return getResponseText(response).trim();
}

async function analyzeVideo({ apiKey, model, filePath, mimeType }) {
  const ai = new GoogleGenAI({ apiKey });
  let uploaded;

  try {
    uploaded = await ai.files.upload({
      file: filePath,
      config: { mimeType }
    });

    const readyFile = await waitForFileReady(ai, uploaded.name);
    const response = await ai.models.generateContent({
      model,
      contents: [createPartFromUri(readyFile.uri, readyFile.mimeType), COACH_PROMPT]
    });

    let output = getResponseText(response).trim();
    if (!hasRequiredStructure(output)) {
      output = await reformatToRequiredStructure(ai, model, output);
    }
    if (!hasRequiredStructure(output)) {
      output = fallbackStructuredResponse();
    }

    return output;
  } finally {
    if (uploaded?.name) {
      try {
        await ai.files.delete({ name: uploaded.name });
      } catch {
        // Non-blocking cleanup.
      }
    }
  }
}

app.post("/api/analyze", rateLimiter, upload.single("video"), async (req, res) => {
  const localFilePath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a video file." });
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Server Gemini API key is not configured. Contact the administrator." });
    }

    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
    const sideOnConfirmed = String(req.body.sideOnConfirmed || "false") === "true";
    if (!sideOnConfirmed) {
      return res.status(400).json({
        error: "Please confirm the uploaded clip is side-on for reliable analysis."
      });
    }

    const analysis = await analyzeVideo({
      apiKey,
      model,
      filePath: req.file.path,
      mimeType: req.file.mimetype || "video/mp4"
    });

    return res.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: `Analysis failed: ${message}` });
  } finally {
    if (localFilePath) {
      try {
        await fs.unlink(localFilePath);
      } catch {
        // Non-blocking cleanup.
      }
    }
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, uptime: Math.floor(process.uptime()) });
});

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Global error handler
app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: `File too large. Maximum size is ${MAX_FILE_BYTES / (1024 * 1024)} MB.` });
  }
  const message = err instanceof Error ? err.message : "Internal server error.";
  console.error("[error]", err);
  res.status(500).json({ error: message });
});

/* ─── Start & graceful shutdown ─────────────────────── */
const server = app.listen(PORT, HOST, () => {
  console.log(
    `Bowling analysis → http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`
  );
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(async () => {
    await fs.rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
