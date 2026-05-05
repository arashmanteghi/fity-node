import { Router } from 'express'
import type { Request, Response } from 'express'
import { getVideoInfo, createDownloadStream } from '../services/ytdlp'

const router = Router()

function isValidUrl(str: string): boolean {
  try {
    const { protocol } = new URL(str)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * GET /api/video/info?url=<video_url>
 * Returns video metadata and all available formats/qualities.
 */
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  const { url } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required query param: url' })
    return
  }
  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  try {
    const info = await getVideoInfo(url)
    res.json(info)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[info]', message)
    res.status(500).json({ error: 'Failed to fetch video info', detail: message })
  }
})

/**
 * GET /api/video/stream?url=<video_url>&format=<format_id>&title=<filename>
 * Streams the video directly to the client.
 */
router.get('/stream', (req: Request, res: Response): void => {
  const { url, format, title } = req.query

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required query param: url' })
    return
  }
  if (!isValidUrl(url)) {
    res.status(400).json({ error: 'Invalid URL' })
    return
  }

  const formatId = typeof format === 'string' ? format : 'best'
  const rawTitle = typeof title === 'string' ? title : ''
  const filename = rawTitle
    ? `${rawTitle.replace(/[^a-z0-9_\-. ]/gi, '_')}.mp4`
    : 'video.mp4'

  const subprocess = createDownloadStream(url, formatId)

  subprocess.stderr?.on('data', (data: Buffer) => {
    console.error('[yt-dlp]', data.toString().trim())
  })

  subprocess.on('error', (err: Error) => {
    console.error('[stream] spawn failed:', err.message)
    if (!res.headersSent) {
      res.status(500).json({ error: 'yt-dlp not found. Install it with: brew install yt-dlp' })
    }
  })

  subprocess.on('close', (code: number | null) => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'Download failed', exitCode: code })
    }
  })

  // Defer headers until first chunk so errors can still be returned as JSON
  subprocess.stdout?.once('data', () => {
    if (!res.headersSent) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Transfer-Encoding', 'chunked')
    }
  })

  subprocess.stdout?.pipe(res)

  req.on('close', () => subprocess.kill())
})

export default router
