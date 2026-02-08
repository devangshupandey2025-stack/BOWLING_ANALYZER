<<<<<<< HEAD
# Side-On Bowling Action Analyzer

Local web app that uses Gemini to generate qualitative, coach-style feedback from a side-on fast bowling video.

## Features

- Upload side-on bowling clips from the browser.
- Uses Gemini Files API for video analysis.
- Enforces coaching-only qualitative feedback constraints.
- Targets known risk cues: mixed action, front-knee collapse, and early non-bowling arm collapse.
- Returns a strict 5-section output structure.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
copy .env.example .env
```

Then set `GEMINI_API_KEY` in `.env`.

3. Run:

```bash
npm start
```

Open `http://localhost:3000`.

## Notes

- You can enter a Gemini API key in the UI instead of `.env` for one-off use.
- Keep clips reasonably short for faster upload and processing.
- This app provides informational coaching feedback, not medical advice.
=======
# BOWLING_ANALYZER
>>>>>>> b7fb55e0d2c4244b12f158a97d05a2885e14e0bb
