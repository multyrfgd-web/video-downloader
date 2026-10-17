import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "./Icons";
import { PlatformIcon } from "./Icons";
import { normalizeTikTokUrl, TIKTOK } from "@/lib/platforms";
import { useToast } from "./Toaster";

interface SearchPanelProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
}

const loadingSteps = [
  "جارٍ التحقق من رابط تيك توك...",
  "جلب بيانات الفيديو من تيك توك...",
  "بانتظار خيارات التنزيل المتاحة...",
];

export function SearchPanel({ url, onUrlChange, onSubmit, loading }: SearchPanelProps) {
  const { push } = useToast();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSupported = normalizeTikTokUrl(url) !== null;

  useEffect(() => {
    if (!loading) {
      setStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [loading]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onUrlChange(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
      push({ kind: "info", title: "الصق الرابط يدوياً", description: "لم يسمح المتصفح بقراءة الحافظة." });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !loading) onSubmit(url);
  };

  return (
    <section id="search" className="scroll-mt-24 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-slate-900/8 bg-white/80 p-5 shadow-2xl shadow-slate-900/5 backdrop-blur-xl sm:p-7 dark:border-white/10 dark:bg-white/5">
          <div
            className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold sm:text-2xl">الصق رابط فيديو تيك توك</h2>
                <p id="link-help" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  فيديوهات تيك توك فقط، بالروابط المباشرة أو المختصرة.
                </p>
              </div>

              <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-900/8 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5">
                {(
                  [
                    { id: "single", label: "رابط واحد" },
                    { id: "batch", label: "روابط متعددة" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    disabled={loading}
                    aria-pressed={mode === item.id}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                      mode === item.id
                        ? "bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "single" ? (
              <div className="mt-5">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400">
                      <Icon name="link" className="h-5 w-5" />
                    </span>
                    <input
                      ref={inputRef}
                      aria-label="رابط فيديو تيك توك"
                      aria-describedby="link-help"
                      aria-invalid={Boolean(url.trim()) && !isSupported}
                      disabled={loading}
                      value={url}
                      onChange={(event) => onUrlChange(event.target.value)}
                      onKeyDown={handleKeyDown}
                      type="url"
                      dir="ltr"
                      placeholder="https://www.tiktok.com/@user/video/..."
                      className="h-14 w-full rounded-2xl border border-slate-900/10 bg-white pr-11 pl-3 text-left text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handlePaste}
                    disabled={loading}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-900/10 bg-slate-100/80 px-5 text-sm font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    title="لصق من الحافظة"
                  >
                    <Icon name="paste" className="h-4.5 w-4.5" />
                    لصق
                  </button>

                  <button
                    type="button"
                    onClick={() => onSubmit(url)}
                    disabled={loading}
                    className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 via-violet-600 to-brand-500 px-7 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25 transition hover:shadow-xl hover:shadow-brand-600/35 disabled:opacity-60"
                  >
                    {loading ? (
                      <Icon name="spinner" className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Icon name="download" className="h-4.5 w-4.5" strokeWidth={2.2} />
                    )}
                    {loading ? "جارٍ جلب المقطع" : "جلب المقطع"}
                  </button>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-xs" aria-live="polite">
                  {url.trim() ? (
                    <span className={cn("inline-flex items-center gap-2 font-semibold", isSupported ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300")}>
                      {isSupported ? <PlatformIcon id="tiktok" className="h-3.5 w-3.5" /> : <Icon name="close" className="h-3.5 w-3.5" />}
                      {isSupported ? "رابط فيديو تيك توك صالح" : "رابط غير مدعوم. أدخل رابط فيديو تيك توك فقط."}
                    </span>
                  ) : (
                    <span className="text-slate-400">انسخ رابط الفيديو من مشاركة ثم نسخ الرابط في تيك توك.</span>
                  )}

                  {url.trim() ? (
                    <button
                      type="button"
                      onClick={() => onUrlChange("")}
                      disabled={loading}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 font-semibold text-slate-400 transition hover:text-rose-500"
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                      مسح
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <textarea
                  aria-label="روابط فيديوهات تيك توك"
                  aria-describedby="link-help"
                  disabled={loading}
                  value={url}
                  onChange={(event) => onUrlChange(event.target.value)}
                  dir="ltr"
                  rows={5}
                  placeholder={"الصق رابط فيديو تيك توك في كل سطر:\nhttps://www.tiktok.com/@user/video/...\nhttps://vm.tiktok.com/.../"}
                  className="w-full resize-y rounded-2xl border border-slate-900/10 bg-white p-4 text-left text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                />
                <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    روابط تيك توك فقط، رابط في كل سطر. تُعالج المقاطع بالتتابع وتُحفظ في السجل.
                  </p>
                  <button
                    type="button"
                    onClick={() => onSubmit(url)}
                    disabled={loading}
                    className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-violet-600 px-5 text-sm font-extrabold whitespace-nowrap text-white shadow-lg shadow-brand-600/25 transition disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? (
                      <Icon name="spinner" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon name="zap" className="h-4 w-4" />
                    )}
                    {loading ? "جارٍ جلب المقاطع" : "جلب المقاطع"}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="mt-5 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-9 w-9 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/25" />
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300">
                      <Icon name="spinner" className="h-4.5 w-4.5 animate-spin" />
                    </span>
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{loadingSteps[step]}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/8 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-brand-500 to-neon-400 transition-[width] duration-700"
                        style={{ width: `${((step + 1) / loadingSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-900/8 pt-4 dark:border-white/8">
              <span className="text-xs text-slate-400">ليس لديك رابط؟</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  onUrlChange(TIKTOK.sample);
                  inputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900/8 bg-white/70 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <PlatformIcon id="tiktok" className="h-3.5 w-3.5" />
                جرّب رابط تيك توك
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
