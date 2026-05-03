# Fity Node

Express backend for the Fity Downloader — fetches video metadata and streams downloads via `yt-dlp`.

## Tech Stack

- **Node.js 22.19.0** + **Express 4**
- **yt-dlp** (system binary) for video extraction
- **Helmet** + **CORS** for security

## Prerequisites

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

## Available Scripts

```bash
npm run dev     # Start with nodemon (auto-restart on file changes)
npm start       # Start in production mode
```

## Project Structure

```
src/
├── index.js              # Express app setup — helmet, CORS, yt-dlp check, port binding
├── routes/
│   └── video.js          # Route handlers and input validation
└── services/
    └── ytdlp.js          # All yt-dlp subprocess calls
```

## API Reference

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
- Merging video+audio formats requires `ffmpeg` installed on the server

## Supported Platforms

YouTube · Instagram · Facebook · Twitter / X — and [many more](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) supported by yt-dlp.
