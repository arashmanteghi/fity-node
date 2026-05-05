# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
npm run dev        # tsx watch src/index.ts — run TypeScript directly with hot reload
npm run build      # tsc — compile TypeScript to dist/
npm run typecheck  # tsc --noEmit — type check without building
npm start          # node dist/index.js — run compiled output (production)
```

No test runner or linter is configured yet.

## System dependency

**yt-dlp must be installed on the host machine.** The app shells out to it for all video operations. The server will refuse to start without it.

```bash
brew install yt-dlp        # macOS
pip3 install yt-dlp        # cross-platform
```

The binary path defaults to `yt-dlp` on `$PATH` and can be overridden via `YTDLP_BIN` in `.env`.

## Architecture

This is a thin Express + TypeScript API layer over `yt-dlp`. There is no database and no authentication.

```
src/
  index.ts              # App entry — helmet, CORS, yt-dlp startup check, port binding
  types/
    video.ts            # Shared types: VideoInfo, VideoFormat (public), YtDlpInfo, YtDlpFormat (raw yt-dlp output)
  routes/
    video.ts            # Route handlers — all input validation lives here
  services/
    ytdlp.ts            # All yt-dlp child_process calls (execFile for info, spawn for streaming)
```

**Request flow:** client → route handler (validates URL, query params) → service (shells out to yt-dlp) → response.

## Endpoints

- `GET /health` — returns `{ status: 'ok' }`.
- `GET /api/video/info?url=` — runs `yt-dlp --dump-single-json`, parses raw output via `YtDlpInfo`, normalises into `VideoInfo`, returns formats sorted by quality descending.
- `GET /api/video/stream?url=&format=&title=` — spawns `yt-dlp --output -` and pipes stdout to the HTTP response. Headers are withheld until the first data chunk arrives so yt-dlp startup errors can still be returned as JSON. Kills the subprocess on client disconnect.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Listening port |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `YTDLP_BIN` | `yt-dlp` | Path to yt-dlp binary |

Copy `.env.example` to `.env` before first run.

## TypeScript

- Strict mode enabled — no `any`, no unused locals/params.
- Raw yt-dlp output is typed via `YtDlpInfo` / `YtDlpFormat` in `src/types/video.ts`.
- Public API response shapes are `VideoInfo` / `VideoFormat` in the same file.
- Express route handlers use explicit `Promise<void>` return type with early `return` after `res.json()` calls to avoid TypeScript complaints.
- Run `npm run typecheck` before committing.

## Deployment

- **Platform:** Fly.io
- **App:** `fity-node-sparkling-firefly-5762`
- **Region:** `arn` (Stockholm)
- **Live URL:** https://fity-node-sparkling-firefly-5762.fly.dev

### CI/CD

Pushing to `main` automatically deploys via GitHub Actions (`.github/workflows/fly-deploy.yml`). Requires `FLY_API_TOKEN` set as a GitHub repository secret.

### Manual deploy

```bash
fly deploy
```

### Secrets

```bash
fly secrets set "KEY=value" --app fity-node-sparkling-firefly-5762
```

### Docker

Multi-stage build — TypeScript is compiled in the build stage, only `dist/` and production `node_modules` are copied to the runtime image. `yt-dlp` and `ffmpeg` are installed in the runtime stage via `pip3`.
