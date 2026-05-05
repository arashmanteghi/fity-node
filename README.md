# Fity Node

Express backend for the Fity Downloader — fetches video metadata and streams downloads via `yt-dlp`.

## Tech Stack

- **Node.js 22.19.0** + **Express 4** + **TypeScript 5**
- **yt-dlp** (system binary) for video extraction
- **Helmet** + **CORS** for security

## Production

| | |
|---|---|
| **Platform** | [Fly.io](https://fly.io) |
| **URL** | https://fity-node-sparkling-firefly-5762.fly.dev |
| **App name** | `fity-node-sparkling-firefly-5762` |
| **Region** | `arn` (Stockholm) |

### Useful commands

```bash
fly status --app fity-node-sparkling-firefly-5762      # check machine status
fly logs --app fity-node-sparkling-firefly-5762        # tail live logs
fly deploy                                              # redeploy after changes
fly secrets set "KEY=value" --app fity-node-sparkling-firefly-5762  # update env vars
```

### First-time deployment steps

These are the exact commands used to deploy the app for the first time:

```bash
brew install flyctl                          # install Fly CLI
fly auth login                               # authenticate with Fly.io
fly launch --no-deploy                       # create the app and generate fly.toml
fly secrets set "ALLOWED_ORIGINS=*"          # allow all origins before frontend is live
fly deploy                                   # build Docker image and deploy
```

After the frontend was deployed on Vercel, the CORS origin was locked down:

```bash
fly secrets set "ALLOWED_ORIGINS=https://your-frontend.vercel.app" --app fity-node-sparkling-firefly-5762
```

### Redeploy

```bash
fly deploy
```

Fly.io builds the Docker image remotely using the multi-stage `Dockerfile` (TypeScript compiled in build stage, only `dist/` copied to runtime image).

---

## Prerequisites (local development)

- Node.js `22.19.0` (use `nvm use` to switch automatically)
- `yt-dlp` installed on the system:

```bash
brew install yt-dlp        # macOS
pip3 install yt-dlp        # cross-platform
```

## Getting Started

```bash
cp .env.example .env
npm install
npm run dev
```

Server runs at `http://localhost:3000`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Listening port |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `YTDLP_BIN` | `yt-dlp` | Path to the yt-dlp binary |

On Fly.io, secrets are managed via:
```bash
fly secrets set "ALLOWED_ORIGINS=https://your-frontend.vercel.app" --app fity-node-sparkling-firefly-5762
```

## Available Scripts

```bash
npm run dev        # tsx watch — run TypeScript directly with hot reload
npm run build      # tsc — compile TypeScript to dist/
npm run typecheck  # tsc --noEmit — type check without building
npm start          # node dist/index.js — run compiled output
```

## Project Structure

```
src/
├── index.ts              # Express app setup — helmet, CORS, yt-dlp check, port binding
├── types/
│   └── video.ts          # Shared types — VideoInfo, VideoFormat, YtDlpInfo, YtDlpFormat
├── routes/
│   └── video.ts          # Route handlers and input validation
└── services/
    └── ytdlp.ts          # All yt-dlp subprocess calls
```

## API Reference

Base URL (production): `https://fity-node-sparkling-firefly-5762.fly.dev`

### `GET /health`
Returns server status.

**Response**
```json
{ "status": "ok" }
```

---

### `GET /api/video/info`
Fetches video metadata and all available formats.

**Query params**

| Param | Required | Description |
|---|---|---|
| `url` | yes | Full URL of the video |

**Example**
```
GET /api/video/info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

**Response**
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://...",
  "duration": 213,
  "uploader": "Rick Astley",
  "platform": "Youtube",
  "webpageUrl": "https://...",
  "formats": [
    {
      "formatId": "137",
      "ext": "mp4",
      "resolution": "1920x1080",
      "quality": 9,
      "note": "1080p",
      "filesize": 80911999,
      "hasVideo": true,
      "hasAudio": false,
      "vcodec": "avc1.640028",
      "acodec": null,
      "tbr": 3038.377
    }
  ]
}
```

---

### `GET /api/video/stream`
Streams the video file directly to the client.

**Query params**

| Param | Required | Description |
|---|---|---|
| `url` | yes | Full URL of the video |
| `format` | no | Format ID from `/info` response (defaults to `best`) |
| `title` | no | Filename for the downloaded file |

**Example**
```
GET /api/video/stream?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=best&title=rickroll
```

**Notes**
- `format=best` lets yt-dlp automatically pick the best available quality
- To merge a video-only format with audio (e.g. `137+140`), encode the `+` as `%2B` in the URL
- Merging video+audio formats requires `ffmpeg` installed on the server (included in the Docker image)

## Deployment

The app is containerised. The `Dockerfile` uses a multi-stage build:

1. **Build stage** — installs all deps, compiles TypeScript → `dist/`
2. **Runtime stage** — installs only production deps + `yt-dlp` + `ffmpeg`, copies `dist/`

To deploy a new version:

```bash
fly deploy
```

## Supported Platforms

YouTube · Instagram · Facebook · Twitter / X — and [many more](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) supported by yt-dlp.
