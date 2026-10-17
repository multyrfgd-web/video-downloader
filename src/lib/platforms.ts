import type { PlatformId } from "./types";

export const TIKTOK = {
  id: "tiktok" as const,
  label: "تيك توك",
  latin: "TikTok",
  color: "#25f4ee",
  gradient: "from-cyan-400 to-pink-500",
  sample: "https://www.tiktok.com/@scout2015/video/6718335390845095173",
};

const TIKTOK_HOSTS = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
]);

export const TIKTOK_ONLY_MESSAGE =
  "التطبيق مخصص لمقاطع تيك توك فقط. الصق رابط فيديو من tiktok.com أو رابط مشاركة من vm.tiktok.com أو vt.tiktok.com.";

export function normalizeTikTokUrl(input: string): string | null {
  const value = input.trim();
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(value);
    const url = new URL(hasScheme ? value : `https://${value}`);

    // Match the real hostname, never a substring in a lookalike domain or query.
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !TIKTOK_HOSTS.has(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    ) {
      return null;
    }

    const isShortHost = url.hostname === "vm.tiktok.com" || url.hostname === "vt.tiktok.com";
    const isVideoPath = isShortHost
      ? /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
      : /^\/(?:@[A-Za-z0-9._]+\/video\/\d{5,25}|share\/video\/\d{5,25}|v\/\d{5,25}(?:\.html)?|t\/[A-Za-z0-9_-]+)\/?$/.test(
          url.pathname,
        );

    if (!isVideoPath) return null;
    url.protocol = "https:";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function detectPlatform(input: string): PlatformId {
  return normalizeTikTokUrl(input) ? "tiktok" : "unknown";
}

export function getPlatform(id: PlatformId) {
  return id === "tiktok"
    ? TIKTOK
    : { ...TIKTOK, id: "unknown" as const, label: "رابط غير مدعوم" };
}