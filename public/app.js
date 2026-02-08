(() => {
  "use strict";

  /* ─── Nav scroll effect ───────────────────────────── */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ─── Smooth anchor scrolling ─────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
    })
  );

  /* ─── DOM refs ────────────────────────────────────── */
  const form         = document.getElementById("analyzeForm");
  const output       = document.getElementById("output");
  const statusEl     = document.getElementById("status");
  const analyzeBtn   = document.getElementById("analyzeBtn");
  const cancelBtn    = document.getElementById("cancelBtn");
  const videoInput   = document.getElementById("video");
  const dropZone     = document.getElementById("dropZone");
  const fileChip     = document.getElementById("fileInfo");
  const fileName     = document.getElementById("fileName");
  const fileSize     = document.getElementById("fileSize");
  const fileClear    = document.getElementById("fileClear");
  const videoPreview = document.getElementById("videoPreview");
  const previewPlayer= document.getElementById("previewPlayer");
  const loadingState = document.getElementById("loadingState");
  const loadingMsg   = document.getElementById("loadingMsg");
  const emptyState   = document.getElementById("emptyState");
  const resultState  = document.getElementById("resultState");
  const steps        = document.querySelectorAll(".step");

  /* ─── Constants ───────────────────────────────────── */
  const MAX_SIZE_MB    = 250;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES  = new Set([
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/webm", "video/x-matroska", "video/mpeg", "video/3gpp",
  ]);

  const LOADING_MESSAGES = [
    "Uploading your delivery to the cloud...",
    "Crunching frame-by-frame footage...",
    "Consulting the AI bowling coach...",
    "Studying the run-up phase...",
    "Tracking the front-foot landing...",
    "Analyzing arm rotation timing...",
    "Checking front knee stability...",
    "Evaluating non-bowling arm path...",
    "Mapping release point mechanics...",
    "Reviewing follow-through balance...",
    "Cross-referencing coaching patterns...",
    "Generating actionable feedback...",
    "Polishing the final report...",
    "Almost there — assembling your analysis...",
    "Reading the pitch conditions... just kidding",
    "Checking if Wasim Akram would approve...",
    "Asking Dale Steyn for a second opinion...",
    "Mimicking Glenn McGrath's line & length check...",
    "Running one last spell of checks...",
  ];

  let controller    = null;
  let msgInterval   = null;
  let stepInterval  = null;

  /* ─── Helpers ─────────────────────────────────────── */
  function fmtBytes(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(1) + " MB";
  }

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
  }

  function showView(view) {
    emptyState.hidden   = view !== "empty";
    loadingState.hidden = view !== "loading";
    resultState.hidden  = view !== "result";
  }

  /* ─── Rotating loading messages ───────────────────── */
  function startLoadingMessages() {
    let idx = 0;
    const shuffled = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5);
    loadingMsg.textContent = shuffled[0];
    msgInterval = setInterval(() => {
      idx = (idx + 1) % shuffled.length;
      loadingMsg.style.opacity = "0";
      setTimeout(() => {
        loadingMsg.textContent = shuffled[idx];
        loadingMsg.style.opacity = "1";
      }, 250);
    }, 3000);
  }

  function stopLoadingMessages() {
    clearInterval(msgInterval);
    msgInterval = null;
  }

  /* ─── Step progression ────────────────────────────── */
  function startStepProgression() {
    const stepList = Array.from(steps);
    let current = 0;
    stepList[0]?.classList.add("active");

    stepInterval = setInterval(() => {
      if (current < stepList.length) {
        stepList[current].classList.remove("active");
        stepList[current].classList.add("done");
      }
      current++;
      if (current < stepList.length) {
        stepList[current].classList.add("active");
      } else {
        clearInterval(stepInterval);
      }
    }, 6000);
  }

  function resetSteps() {
    clearInterval(stepInterval);
    stepInterval = null;
    steps.forEach(s => { s.classList.remove("active", "done"); });
  }

  /* ─── Loading toggle ──────────────────────────────── */
  function setLoading(active) {
    analyzeBtn.disabled = active;
    cancelBtn.hidden    = !active;

    if (active) {
      showView("loading");
      startLoadingMessages();
      startStepProgression();
    } else {
      stopLoadingMessages();
      resetSteps();
    }
  }

  /* ─── File selection & preview ────────────────────── */
  function displayFile(file) {
    if (!file) {
      fileChip.hidden     = true;
      videoPreview.hidden = true;
      if (previewPlayer.src) { URL.revokeObjectURL(previewPlayer.src); previewPlayer.removeAttribute("src"); }
      return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = fmtBytes(file.size);
    fileChip.hidden      = false;

    // Video preview
    if (previewPlayer.src) URL.revokeObjectURL(previewPlayer.src);
    const url = URL.createObjectURL(file);
    previewPlayer.src    = url;
    videoPreview.hidden  = false;

    // Validation
    if (file.size > MAX_SIZE_BYTES) {
      setStatus(`File exceeds ${MAX_SIZE_MB} MB limit.`, true);
    } else if (file.type && !ALLOWED_TYPES.has(file.type) && !file.type.startsWith("video/")) {
      setStatus("File does not appear to be a supported video format.", true);
    } else {
      setStatus("");
    }
  }

  videoInput.addEventListener("change", () => displayFile(videoInput.files?.[0]));

  fileClear.addEventListener("click", () => {
    videoInput.value = "";
    displayFile(null);
    setStatus("");
  });

  /* ─── Drag & drop ─────────────────────────────────── */
  ["dragenter", "dragover"].forEach(evt =>
    dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); })
  );
  ["dragleave", "drop"].forEach(evt =>
    dropZone.addEventListener(evt, () => dropZone.classList.remove("drag-over"))
  );

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      videoInput.files = dt.files;
      displayFile(file);
    }
  });

  /* ─── Cancel ──────────────────────────────────────── */
  cancelBtn.addEventListener("click", () => {
    if (controller) { controller.abort(); controller = null; }
  });

  /* ─── Submit ──────────────────────────────────────── */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const data      = new FormData(form);
    const video     = data.get("video");
    const confirmed = data.get("sideOnConfirmed") === "on";

    if (!(video instanceof File) || video.size === 0) {
      return setStatus("Please select a video file.", true);
    }
    if (video.size > MAX_SIZE_BYTES) {
      return setStatus(`File is too large (${fmtBytes(video.size)}). Maximum is ${MAX_SIZE_MB} MB.`, true);
    }
    if (!confirmed) {
      return setStatus("Please confirm the clip is side-on before analysis.", true);
    }

    data.set("sideOnConfirmed", "true");
    setLoading(true);
    setStatus("Analyzing...");

    controller = new AbortController();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: data,
        signal: controller.signal,
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || `Server error (${res.status}).`);

      output.textContent = payload.analysis || "No analysis text returned.";
      showView("result");
      setStatus("Analysis complete.");
    } catch (err) {
      if (err.name === "AbortError") {
        setStatus("Analysis cancelled.", true);
        showView("empty");
      } else {
        const msg = err instanceof Error ? err.message : "Unexpected error.";
        setStatus(msg, true);
        showView("empty");
      }
    } finally {
      setLoading(false);
      controller = null;
    }
  });
})();
