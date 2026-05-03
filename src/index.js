require('dotenv').config()

const { execFileSync } = require('child_process')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const videoRoutes = require('./routes/video')

const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp'

// Fail fast if yt-dlp is not available
try {
  const version = execFileSync(YTDLP_BIN, ['--version'], { encoding: 'utf8' }).trim()
  console.log(`yt-dlp ${version} detected`)
} catch {
  console.error(`ERROR: '${YTDLP_BIN}' not found. Install it first:`)
  console.error('  macOS:       brew install yt-dlp')
  console.error('  cross-platform: pip3 install yt-dlp')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*'

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/video', videoRoutes)

app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`fity-node running on http://localhost:${PORT}`)
})
