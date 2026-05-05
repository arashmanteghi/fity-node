import 'dotenv/config'
import { execFileSync } from 'child_process'
import express from 'express'
import type { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import videoRoutes from './routes/video'

const YTDLP_BIN = process.env.YTDLP_BIN ?? 'yt-dlp'

try {
  const version = execFileSync(YTDLP_BIN, ['--version'], { encoding: 'utf8' }).trim()
  console.log(`yt-dlp ${version} detected`)
} catch {
  console.error(`ERROR: '${YTDLP_BIN}' not found. Install it first:`)
  console.error('  macOS:          brew install yt-dlp')
  console.error('  cross-platform: pip3 install yt-dlp')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT ?? 3000

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*'

app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }))
app.use('/api/video', videoRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`fity-node running on http://localhost:${PORT}`)
})
