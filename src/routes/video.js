const express = require('express')
const { getVideoInfo, createDownloadStream } = require('../services/ytdlp')

const router = express.Router()

function isValidUrl(str) {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * GET /api/video/info?url=<video_url>
 * Returns video metadata and all available formats/qualities.
 */
router.get('/info', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing required query param: url' })
  }
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  try {
    const info = await getVideoInfo(url)
    res.json(info)
  } catch (err) {
    console.error('[info]', err.message)
    res.status(500).json({ error: 'Failed to fetch video info', detail: err.message })
  }
})

/**
 * GET /api/video/stream?url=<video_url>&format=<format_id>&title=<filename>
 * Streams the video directly to the client.
 *
 * format defaults to "best" if omitted.
 * title is used as the downloaded filename (optional).
 */
router.get('/stream', (req, res) => {
  const { url, format, title } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing required query param: url' })
  }
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  const formatId = format || 'best'
  const filename = title
    ? `${title.replace(/[^a-z0-9_\-. ]/gi, '_')}.mp4`
    : 'video.mp4'

  const subprocess = createDownloadStream(url, formatId)

  subprocess.stderr.on('data', (data) => {
    console.error('[yt-dlp]', data.toString().trim())
  })

  subprocess.on('error', (err) => {
    console.error('[stream] spawn failed:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'yt-dlp not found. Install it with: brew install yt-dlp' })
    }
  })

  subprocess.on('close', (code) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'Download failed', exitCode: code })
    }
  })

  // Wait for first chunk before sending headers so we can still return JSON errors
  subprocess.stdout.once('data', () => {
    if (!res.headersSent) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Transfer-Encoding', 'chunked')
    }
  })

  subprocess.stdout.pipe(res)

  // Client disconnected — kill yt-dlp to stop wasting bandwidth
  req.on('close', () => subprocess.kill())
})

module.exports = router
