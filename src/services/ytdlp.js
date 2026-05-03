const { execFile, spawn } = require('child_process')
const { promisify } = require('util')

const execFileAsync = promisify(execFile)

// yt-dlp must be installed on the system (brew install yt-dlp  OR  pip3 install yt-dlp)
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp'

const BASE_ARGS = [
  '--no-warnings',
  '--no-check-certificates',
]

async function getVideoInfo(url) {
  const args = [
    ...BASE_ARGS,
    '--dump-single-json',
    '--prefer-free-formats',
    url,
  ]

  const { stdout } = await execFileAsync(YTDLP_BIN, args, { maxBuffer: 10 * 1024 * 1024 })
  const info = JSON.parse(stdout)

  const formats = (info.formats || [])
    .filter((f) => f.format_id && (f.url || f.manifest_url))
    .map((f) => ({
      formatId: f.format_id,
      ext: f.ext,
      resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : null),
      quality: f.quality ?? null,
      note: f.format_note || null,
      filesize: f.filesize || f.filesize_approx || null,
      hasVideo: f.vcodec !== 'none',
      hasAudio: f.acodec !== 'none',
      vcodec: f.vcodec !== 'none' ? f.vcodec : null,
      acodec: f.acodec !== 'none' ? f.acodec : null,
      tbr: f.tbr || null,
    }))
    .sort((a, b) => (b.quality ?? -1) - (a.quality ?? -1))

  return {
    id: info.id,
    title: info.title,
    thumbnail: info.thumbnail,
    duration: info.duration,
    uploader: info.uploader || info.channel,
    platform: info.extractor_key,
    webpageUrl: info.webpage_url,
    formats,
  }
}

function createDownloadStream(url, formatId) {
  const args = [
    ...BASE_ARGS,
    '--format', formatId,
    '--output', '-',
    url,
  ]

  // spawn returns a ChildProcess — stdout is a readable stream
  return spawn(YTDLP_BIN, args)
}

module.exports = { getVideoInfo, createDownloadStream }
