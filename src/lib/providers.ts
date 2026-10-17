import { normalizeTikTokUrl, TIKTOK_ONLY_MESSAGE } from "./platforms";
import type { MediaResult, ProviderAttempt } from "./types";

const REQUEST_TIMEOUT = 22_000;

interface TikwmResponse {
  code: number;
  msg?: string;
  data?: {
    id?: string | number;
    title?: string;
    cover?: string;
    origin_cover?: string;
    duration?: number;
    play?: string;
    hdplay?: string;
    wmplay?: string;
    music?: string;
    music_info?: { play?: string };
    images?: string[];
    size?: number;
    hd_size?: number;
    play_count?: number;
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    author?: { nickname?: string; unique_id?: string; avatar?: string };
  };
}

function safeMediaUrl(value?: string): string | undefined {
  if (!value || (!/^https?:\/\//i.test(value) && !value.startsWith("/"))) return undefined;
  try {
    const url = new URL(value, "https://www.tikwm.com");
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export interface ResolveOutcome {
  result: MediaResult | null;
  attempts: ProviderAttempt[];
  error?: string;
}

export async function resolveMedia(input: string): Promise<ResolveOutcome> {
  const url = normalizeTikTokUrl(input);
  if (!url) return { result: null, attempts: [], error: TIKTOK_ONLY_MESSAGE };

  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const attempt = { provider: "tikwm", label: "TikWM" };

  try {
    const endpoint = new URL("https://www.tikwm.com/api/");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("hd", "1");

    const response = await fetch(endpoint.href, { signal: controller.signal });
    if (response.status === 429) throw new Error("طلبات كثيرة. انتظر قليلاً ثم أعد المحاولة.");
    if (!response.ok) throw new Error("خدمة تنزيل تيك توك غير متاحة الآن. حاول لاحقاً.");

    const payload = (await response.json()) as TikwmResponse;
    if (payload?.code !== 0 || !payload.data) {
      if (/limit|too many|frequent/i.test(payload?.msg ?? "")) {
        throw new Error("طلبات كثيرة. انتظر قليلاً ثم أعد المحاولة.");
      }
      throw new Error("تعذّر جلب مقطع تيك توك. تأكد من أن الفيديو عام ولم يتم حذفه.");
    }

    const data = payload.data;
    const hdUrl = safeMediaUrl(data.hdplay);
    const sdUrl = safeMediaUrl(data.play);
    if (data.images?.length || (!hdUrl && !sdUrl)) {
      throw new Error("هذا الرابط ليس مقطع فيديو متاحاً. يدعم التطبيق فيديوهات تيك توك فقط، وليس منشورات الصور أو الحسابات.");
    }

    const result: MediaResult = {
      id: String(data.id ?? Date.now()),
      platform: "tiktok",
      kind: "video",
      title: data.title || "مقطع من تيك توك",
      author: data.author?.nickname || data.author?.unique_id,
      authorAvatar: safeMediaUrl(data.author?.avatar),
      thumbnail: safeMediaUrl(data.cover) || safeMediaUrl(data.origin_cover),
      duration: data.duration,
      videoUrl: hdUrl || sdUrl,
      videoSdUrl: sdUrl,
      noWatermarkUrl: hdUrl || sdUrl,
      watermarkedUrl: safeMediaUrl(data.wmplay),
      audioUrl: safeMediaUrl(data.music) || safeMediaUrl(data.music_info?.play),
      coverUrl: safeMediaUrl(data.origin_cover) || safeMediaUrl(data.cover),
      size: hdUrl ? data.hd_size : data.size,
      quality: hdUrl ? "HD" : "SD",
      stats: {
        views: data.play_count,
        likes: data.digg_count,
        comments: data.comment_count,
        shares: data.share_count,
      },
      sourceUrl: url,
      provider: "TikWM",
      createdAt: Date.now(),
    };

    return {
      result,
      attempts: [{ ...attempt, ok: true, ms: Math.round(performance.now() - started) }],
    };
  } catch (error) {
    const message = controller.signal.aborted
      ? "انتهت مهلة جلب المقطع. تحقق من اتصالك ثم أعد المحاولة."
      : error instanceof TypeError || error instanceof SyntaxError
        ? "تعذّر الاتصال بخدمة تيك توك. تحقق من اتصالك أو حاول لاحقاً."
        : error instanceof Error
          ? error.message
          : "تعذّر جلب المقطع. حاول مرة أخرى.";
    return {
      result: null,
      error: message,
      attempts: [{ ...attempt, ok: false, message, ms: Math.round(performance.now() - started) }],
    };
  } finally {
    clearTimeout(timeout);
  }
}

export interface DownloadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export async function downloadMedia(
  url: string,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<"blob" | "redirect"> {
  const mediaUrl = safeMediaUrl(url);
  if (!mediaUrl) throw new Error("رابط التنزيل غير صالح.");

  try {
    const response = await fetch(mediaUrl, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const total = Number(response.headers.get("content-length") || 0);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("لا يمكن قراءة المحتوى");

    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        onProgress?.({
          percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 50,
          loaded,
          total,
        });
      }
    }

    const blob = new Blob(chunks as BlobPart[], {
      type: response.headers.get("content-type") || "video/mp4",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    onProgress?.({ percent: 100, loaded, total });
    return "blob";
  } catch {
    // Some TikTok CDNs block cross-origin fetches but allow opening the media.
    window.open(mediaUrl, "_blank", "noopener,noreferrer");
    return "redirect";
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}