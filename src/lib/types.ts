export type PlatformId = "tiktok" | "unknown";

export interface MediaStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface MediaResult {
  id: string;
  platform: "tiktok";
  kind: "video";
  title: string;
  description?: string;
  author?: string;
  authorAvatar?: string;
  thumbnail?: string;
  duration?: number;
  /** رابط الفيديو بجودة عالية */
  videoUrl?: string;
  /** رابط الفيديو بجودة قياسية */
  videoSdUrl?: string;
  /** رابط الفيديو بدون علامة مائية */
  noWatermarkUrl?: string;
  /** رابط الفيديو مع العلامة المائية */
  watermarkedUrl?: string;
  /** رابط الصوت */
  audioUrl?: string;
  /** رابط صورة الغلاف */
  coverUrl?: string;
  size?: number;
  quality?: string;
  stats?: MediaStats;
  sourceUrl: string;
  provider: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  platform: "tiktok";
  title: string;
  author?: string;
  thumbnail?: string;
  provider: string;
  videoUrl?: string;
  audioUrl?: string;
  coverUrl?: string;
  duration?: number;
  kind: "video";
  favorite: boolean;
  createdAt: number;
}

export interface ProviderAttempt {
  provider: string;
  label: string;
  ok: boolean;
  message?: string;
  ms: number;
}
