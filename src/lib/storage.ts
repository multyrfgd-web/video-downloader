import { normalizeTikTokUrl } from "./platforms";
import type { HistoryItem, MediaResult } from "./types";

const KEY = "mqata3.history.v1";
const THEME_KEY = "mqata3.theme";
const MAX_ITEMS = 80;

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isTikTokHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    item.platform === "tiktok" &&
    item.kind === "video" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.provider === "string" &&
    typeof item.url === "string" &&
    normalizeTikTokUrl(item.url) !== null &&
    isHttpUrl(item.videoUrl) &&
    typeof item.favorite === "boolean" &&
    typeof item.createdAt === "number" &&
    Number.isFinite(item.createdAt) &&
    (item.duration === undefined || typeof item.duration === "number") &&
    (item.author === undefined || typeof item.author === "string") &&
    [item.thumbnail, item.audioUrl, item.coverUrl].every((url) => url === undefined || isHttpUrl(url))
  );
}

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // Keep TikTok favorites when migrating the old multi-platform history.
    return Array.isArray(parsed) ? parsed.filter(isTikTokHistoryItem).slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.filter(isTikTokHistoryItem).slice(0, MAX_ITEMS)));
  } catch {
    /* تجاهل الأخطاء */
  }
}

export function historyItemFromResult(result: MediaResult): HistoryItem {
  return {
    id: `${result.platform}-${result.id}-${result.createdAt}`,
    url: result.sourceUrl,
    platform: result.platform,
    title: result.title,
    author: result.author,
    thumbnail: result.thumbnail,
    provider: result.provider,
    videoUrl: result.videoUrl,
    audioUrl: result.audioUrl,
    coverUrl: result.coverUrl,
    duration: result.duration,
    kind: result.kind,
    favorite: false,
    createdAt: Date.now(),
  };
}

export function upsertHistory(items: HistoryItem[], item: HistoryItem): HistoryItem[] {
  if (!isTikTokHistoryItem(item)) return items.filter(isTikTokHistoryItem);
  const existing = items.find((i) => i.url === item.url);
  const merged: HistoryItem = existing
    ? { ...existing, ...item, id: existing.id, favorite: existing.favorite, createdAt: existing.createdAt }
    : item;
  return [merged, ...items.filter((i) => i.url !== item.url && isTikTokHistoryItem(i))].slice(0, MAX_ITEMS);
}

export function toggleFavorite(items: HistoryItem[], id: string): HistoryItem[] {
  return items.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item));
}

export function removeHistoryItem(items: HistoryItem[], id: string): HistoryItem[] {
  return items.filter((item) => item.id !== id);
}

export function clearHistory(items: HistoryItem[]): HistoryItem[] {
  return items.filter((item) => item.favorite);
}

export function getStoredTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    /* تجاهل */
  }
  return null;
}

export function storeTheme(theme: "light" | "dark"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* تجاهل */
  }
}
