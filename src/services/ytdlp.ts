import { execFile, spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { promisify } from 'util'
import type { VideoInfo, VideoFormat, YtDlpInfo } from '../types/video'

const execFileAsync = promisify(execFile)

const YTDLP_BIN = process.env.YTDLP_BIN ?? 'yt-dlp'

const BASE_ARGS = ['--no-warnings', '--no-check-certificates']

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const args = [...BASE_ARGS, '--dump-single-json', '--prefer-free-formats', url]

  const { stdout } = await execFileAsync(YTDLP_BIN, args, {
    maxBuffer: 10 * 1024 * 1024,
  })

  const raw: YtDlpInfo = JSON.parse(stdout)

  const formats: VideoFormat[] = (raw.formats ?? [])
    .filter((f) => f.format_id && (f.url ?? f.manifest_url))
    .map((f): VideoFormat => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution ?? (f.width && f.height ? `${f.width}x${f.height}` : null),
      quality: f.quality ?? null,
      note: f.format_note ?? null,
      filesize: f.filesize ?? f.filesize_approx ?? null,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
      vcodec: f.vcodec !== 'none' ? f.vcodec : null,
      acodec: f.acodec !== 'none' ? f.acodec : null,
      tbr: f.tbr ?? null,
    }))
    .sort((a, b) => (b.quality ?? -1) - (a.quality ?? -1))

  return {
    id: raw.id,
    title: raw.title,
    thumbnail: raw.thumbnail ?? null,
    duration: raw.duration ?? null,
    uploader: raw.uploader ?? raw.channel ?? null,
    platform: raw.extractor_key ?? null,
    webpageUrl: raw.webpage_url,
    formats,
  }
}

export function createDownloadStream(url: string, formatId: string): ChildProcess {
  const args = [...BASE_ARGS, '--format', formatId, '--output', '-', url]
  return spawn(YTDLP_BIN, args)
}
