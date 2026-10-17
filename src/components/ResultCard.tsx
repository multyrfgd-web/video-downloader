import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Icon, type IconName } from "./Icons";
import { PlatformIcon } from "./Icons";
import { getPlatform } from "@/lib/platforms";
import { formatBytes, formatCount, formatDuration, safeFilename, truncate } from "@/lib/format";
import type { MediaResult } from "@/lib/types";

export interface DownloadOption {
  key: string;
  label: string;
  hint: string;
  icon: IconName;
  url: string;
  filename: string;
  accent: string;
}

interface ResultCardProps {
  result: MediaResult;
  progress: Record<string, number>;
  onDownload: (option: DownloadOption) => void;
  onCopy: (url: string, label: string) => void;
  onShare: (result: MediaResult) => void;
}

export function ResultCard({ result, progress, onDownload, onCopy, onShare }: ResultCardProps) {
  const [preview, setPreview] = useState(false);
  const platform = getPlatform(result.platform);
  const baseName = safeFilename(`${result.author ? `${result.author}-` : ""}${result.title}`, "maqta3");

  const options = useMemo<DownloadOption[]>(() => {
    const list: DownloadOption[] = [];
    if (result.videoUrl) {
      list.push({
        key: "video-hd",
        label: result.quality === "HD" ? "فيديو تيك توك HD" : "فيديو تيك توك",
        hint: "بدون علامة مائية · أعلى جودة متاحة",
        icon: "video",
        url: result.videoUrl,
        filename: `${baseName}.mp4`,
        accent: "from-brand-500 to-violet-500",
      });
    }
    if (result.videoSdUrl && result.videoSdUrl !== result.videoUrl) {
      list.push({
        key: "video-sd",
        label: "فيديو قياسي",
        hint: "بدون علامة مائية · حجم أصغر للمشاركة",
        icon: "video",
        url: result.videoSdUrl,
        filename: `${baseName}-sd.mp4`,
        accent: "from-sky-500 to-cyan-400",
      });
    }
    if (result.audioUrl) {
      list.push({
        key: "audio",
        label: "الصوت فقط (MP3)",
        hint: "موسيقى المقطع بدون الفيديو",
        icon: "music",
        url: result.audioUrl,
        filename: `${baseName}.mp3`,
        accent: "from-fuchsia-500 to-pink-500",
      });
    }
    if (result.coverUrl) {
      list.push({
        key: "cover",
        label: "صورة الغلاف",
        hint: "أعلى دقة للغلاف",
        icon: "image",
        url: result.coverUrl,
        filename: `${baseName}-cover.jpg`,
        accent: "from-amber-500 to-orange-500",
      });
    }
    return list;
  }, [result, baseName]);

  const stats = result.stats;
  const statItems = [
    { label: "مشاهدات", value: formatCount(stats?.views) },
    { label: "إعجابات", value: formatCount(stats?.likes) },
    { label: "تعليقات", value: formatCount(stats?.comments) },
    { label: "مشاركات", value: formatCount(stats?.shares) },
  ].filter((item) => item.value !== "—");

  return (
    <section className="mt-8 animate-rise px-4 sm:px-6 motion-reduce:animate-none">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-900/8 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-900/8 px-5 py-4 dark:border-white/8 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                platform.gradient,
              )}
            >
              <PlatformIcon id={result.platform} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold">تم جلب المقطع بنجاح</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                المصدر: {result.provider} · {platform.label}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
            جاهز للتنزيل
          </span>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[260px_1fr]">
          <div>
            <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-slate-900/8 bg-slate-100 dark:border-white/10 dark:bg-slate-950">
              {result.thumbnail ? (
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Icon name="image" className="h-10 w-10" />
                </div>
              )}

              {result.videoUrl ? (
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/25 backdrop-blur-[2px] transition focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="معاينة المقطع"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-xl transition hover:scale-110">
                    <Icon name="play" className="h-6 w-6 translate-x-0.5" />
                  </span>
                </button>
              ) : null}

              {result.duration ? (
                <span className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-white">
                  {formatDuration(result.duration)}
                </span>
              ) : null}
            </div>

            {result.size ? (
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                حجم الملف التقريبي: {formatBytes(result.size)}
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <h3 className="text-base leading-8 font-extrabold sm:text-lg">
              {truncate(result.title, 120)}
            </h3>

            {result.author ? (
              <div className="mt-3 flex items-center gap-2.5">
                {result.authorAvatar ? (
                  <img
                    src={result.authorAvatar}
                    alt={result.author}
                    loading="lazy"
                    className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/60 dark:ring-white/10"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-bold">{result.author}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {platform.label} · {new Date(result.createdAt).toLocaleDateString("ar")}
                  </p>
                </div>
              </div>
            ) : null}

            {statItems.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {statItems.map((item) => (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900/8 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {!options.length ? (
                <div className="col-span-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <div className="flex items-start gap-3">
                    <Icon name="close" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    <p>
                      لا يتوفر فيديو قابل للتنزيل. تأكد من أن مقطع تيك توك عام، ثم أعد جلبه.
                    </p>
                  </div>
                </div>
              ) : null}
              {options.map((option) => {
                const value = progress[option.key];
                const isDownloading = typeof value === "number";
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => onDownload(option)}
                    disabled={isDownloading}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-900/8 bg-slate-50/80 p-3 text-right transition hover:border-brand-400/60 hover:shadow-lg hover:shadow-brand-500/10 disabled:cursor-wait dark:border-white/10 dark:bg-white/4",
                      isDownloading && "border-brand-400/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                        option.accent,
                      )}
                    >
                      <Icon name={option.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{option.label}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {option.hint}
                      </span>
                    </span>
                    {isDownloading ? (
                      <span className="flex items-center gap-2 text-[11px] font-bold text-brand-600 dark:text-brand-300">
                        <Icon name="spinner" className="h-4 w-4 animate-spin" />
                        {value}%
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/5 text-slate-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-white/10 dark:text-slate-300">
                        <Icon name="download" className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                    )}
                    {isDownloading ? (
                      <span
                        className="absolute inset-x-0 bottom-0 h-1 bg-brand-500/60 transition-[width] duration-300"
                        style={{ width: `${value}%` }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {options.slice(0, 1).map((option) => (
                <button
                  key={`copy-${option.key}`}
                  type="button"
                  onClick={() => onCopy(option.url, option.label)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  <Icon name="copy" className="h-4 w-4" />
                  نسخ رابط {option.label}
                </button>
              ))}
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <Icon name="external" className="h-4 w-4" />
                فتح الفيديو في تيك توك
              </a>
              <button
                type="button"
                onClick={() => onShare(result)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <Icon name="wave" className="h-4 w-4" />
                مشاركة
              </button>
            </div>

          </div>
        </div>
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade"
          onClick={() => setPreview(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="معاينة فيديو تيك توك"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {result.videoUrl ? (
              <video src={result.videoUrl} controls autoPlay playsInline className="max-h-[70vh] w-full" />
            ) : null}
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
              aria-label="إغلاق المعاينة"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
