import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Icon, PlatformIcon } from "./Icons";
import { getPlatform } from "@/lib/platforms";
import { formatDuration, timeAgo, truncate } from "@/lib/format";
import type { HistoryItem } from "@/lib/types";

interface HistoryPanelProps {
  items: HistoryItem[];
  onRedownload: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistoryPanel({
  items,
  onRedownload,
  onToggleFavorite,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (favoritesOnly && !item.favorite) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.author ?? "").toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q)
      );
    });
  }, [items, query, favoritesOnly]);

  return (
    <section id="history" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">سجل مقاطع تيك توك</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              المقاطع التي جلبتها والمفضلة محفوظة محلياً في متصفحك فقط.
            </p>
          </div>

          {items.length ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 dark:text-rose-300"
            >
              <Icon name="trash" className="h-4 w-4" />
              مسح السجل (مع الاحتفاظ بالمفضلة)
            </button>
          ) : null}
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400">
              <Icon name="search" className="h-4.5 w-4.5" />
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="البحث في مقاطع تيك توك المحفوظة"
              placeholder="ابحث في مقاطع تيك توك..."
              className="h-12 w-full rounded-2xl border border-slate-900/10 bg-white pr-11 pl-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFavoritesOnly(false)}
              aria-pressed={!favoritesOnly}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                !favoritesOnly
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "border border-slate-900/8 bg-white/70 text-slate-600 hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
              )}
            >
              الكل ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFavoritesOnly(true)}
              aria-pressed={favoritesOnly}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                favoritesOnly
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                  : "border border-slate-900/8 bg-white/70 text-slate-600 hover:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300",
              )}
            >
              <Icon name="star" className="h-3.5 w-3.5" />
              المفضلة ({items.filter((item) => item.favorite).length})
            </button>
          </div>
        </div>

        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-900/15 bg-white/40 p-10 text-center dark:border-white/15 dark:bg-white/2">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-400 dark:bg-white/5">
              <Icon name="clock" className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-extrabold">لا يوجد سجل بعد</p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              الصق رابط فيديو تيك توك في الأعلى لجلب المقطع وحفظه في السجل.
            </p>
          </div>
        ) : !filtered.length ? (
          <div className="rounded-3xl border border-dashed border-slate-900/15 bg-white/40 p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/2 dark:text-slate-400">
            لا توجد نتائج مطابقة للبحث.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const platform = getPlatform(item.platform);
              return (
                <article
                  key={item.id}
                  className="group relative flex gap-3 rounded-2xl border border-slate-900/8 bg-white/70 p-3 shadow-sm transition hover:border-brand-400/50 hover:shadow-lg hover:shadow-brand-500/10 dark:border-white/8 dark:bg-white/4"
                >
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Icon name="video" className="h-5 w-5" />
                      </div>
                    )}
                    {item.duration ? (
                      <span className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1.5 text-[10px] font-bold text-white">
                        {formatDuration(item.duration)}
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <PlatformIcon id={item.platform} className="h-3 w-3" />
                      {platform.label}
                      <span>·</span>
                      {timeAgo(item.createdAt)}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-6 font-bold">{truncate(item.title, 70)}</p>
                    {item.author ? (
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.author}
                      </p>
                    ) : null}

                    <div className="mt-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onRedownload(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500/12 px-2.5 py-1.5 text-[11px] font-bold text-brand-700 transition hover:bg-brand-500 hover:text-white dark:text-brand-300"
                      >
                        <Icon name="download" className="h-3.5 w-3.5" />
                        تنزيل
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg border transition",
                          item.favorite
                            ? "border-amber-400/50 bg-amber-400/15 text-amber-500"
                            : "border-slate-900/10 text-slate-400 hover:text-amber-500 dark:border-white/10",
                        )}
                        aria-label={item.favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                      >
                        <Icon
                          name="star"
                          className="h-3.5 w-3.5"
                          strokeWidth={2}
                          filled={item.favorite}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-900/10 text-slate-400 transition hover:border-rose-500 hover:text-rose-500 dark:border-white/10"
                        aria-label="حذف"
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
