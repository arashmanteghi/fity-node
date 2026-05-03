# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # run in production
npm run dev        # run with nodemon (auto-restart on file changes)
```

No test runner or linter is configured yet.

## System dependency

**yt-dlp must be installed on the host machine.** The app shells out to it for all video operations.

```bash
brew install yt-dlp   # macOS
pip3 install yt-dlp   # cross-platform
```

The binary path defaults to `yt-dlp` on `$PATH` but can be overridden via `YTDLP_BIN` in `.env`.

## Architecture

This is a thin Express API layer over `yt-dlp`. There is no database and no authentication.

```
src/
  index.js              # Express app setup (helmet, cors, error handler, port binding)
  routes/video.js       # Route handlers — input validation lives here
  services/ytdlp.js     # All yt-dlp subprocess calls
```

**Request flow:** client → route handler (validates URL) → service (shells out to yt-dlp) → response.

### Two endpoints

- `GET /api/video/info?url=` — runs `yt-dlp --dump-single-json`, parses and normalises the format list, returns metadata + available formats sorted by quality descending.
- `GET /api/video/stream?url=&format=&title=` — spawns `yt-dlp --output -` and pipes stdout directly to the HTTP response. Headers are withheld until the first chunk arrives so JSON error responses can still be sent if yt-dlp fails immediately. Kills the subprocess when the client disconnects.

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Listening port |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `YTDLP_BIN` | `yt-dlp` | Path to yt-dlp binary |
| `MAX_DURATION` | `3600` | Max video duration in seconds (0 = no limit) — parsed but enforcement must be added in the route |

Copy `.env.example` to `.env` before first run.
