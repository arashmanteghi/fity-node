export interface VideoFormat {
  formatId: string
  ext: string
  resolution: string | null
  quality: number | null
  note: string | null
  filesize: number | null
  hasVideo: boolean
  hasAudio: boolean
  vcodec: string | null
  acodec: string | null
  tbr: number | null
}

export interface VideoInfo {
  id: string
  title: string
  thumbnail: string | null
  duration: number | null
  uploader: string | null
  platform: string | null
  webpageUrl: string
  formats: VideoFormat[]
}

// Raw yt-dlp JSON output shapes
export interface YtDlpFormat {
  format_id: string
  ext: string
  resolution?: string
  width?: number
  height?: number
  quality?: number
  format_note?: string
  filesize?: number
  filesize_approx?: number
  vcodec: string
  acodec: string
  tbr?: number
  url?: string
  manifest_url?: string
}

export interface YtDlpInfo {
  id: string
  title: string
  thumbnail?: string
  duration?: number
  uploader?: string
  channel?: string
  extractor_key: string
  webpage_url: string
  formats?: YtDlpFormat[]
}
