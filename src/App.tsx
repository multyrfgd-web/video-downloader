import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SearchPanel } from "@/components/SearchPanel";
import { ResultCard, type DownloadOption } from "@/components/ResultCard";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Icon, PlatformIcon } from "@/components/Icons";
import { ToastProvider, useToast } from "@/components/Toaster";
import { copyText, downloadMedia, resolveMedia } from "@/lib/providers";
import { normalizeTikTokUrl, TIKTOK_ONLY_MESSAGE } from "@/lib/platforms";
import { safeFilename } from "@/lib/format";
import {
  clearHistory,
  getStoredTheme,
  historyItemFromResult,
  loadHistory,
  removeHistoryItem,
  saveHistory,
  storeTheme,
  toggleFavorite,
  upsertHistory,
} from "@/lib/storage";
import type { HistoryItem, MediaResult } from "@/lib/types";

interface BatchLog {
  url: string;
  ok: boolean;
  title?: string;
  message?: string;
}

const faq = [
  {
    q: "هل أحتاج إلى تسجيل الدخول أو تثبيت برنامج؟",
    a: "لا تحتاج إلى حساب أو تثبيت تطبيق. انسخ رابط فيديو عام من تيك توك، الصقه هنا، ثم اختر التنزيل بعد جلب المقطع.",
  },
  {
    q: "كيف يتم اختيار جودة الفيديو؟",
    a: "يجلب التطبيق الفيديو عبر خدمة TikWM ويعرض الجودة المتاحة فعلياً، مثل HD أو SD. يتوفر تنزيل الفيديو بدون علامة مائية، والصوت والغلاف إذا أتاحها المصدر.",
  },
  {
    q: "أين تُحفظ الملفات؟",
    a: "يحدد متصفحك مكان حفظ الملفات. إذا منع المصدر التنزيل المباشر، يُفتح الملف لتتمكن من حفظه. يُحفظ سجل مقاطع تيك توك والمفضلة محلياً في متصفحك فقط.",
  },
  {
    q: "ما الروابط التي يدعمها التطبيق؟",
    a: "فيديوهات تيك توك فقط: الروابط المباشرة من tiktok.com وروابط المشاركة المختصرة من vm.tiktok.com وvt.tiktok.com وtiktok.com/t/. لا يدعم روابط الحسابات أو منشورات الصور أو المنصات الأخرى.",
  },
  {
    q: "لماذا يفشل بعض الروابط؟",
    a: "قد يكون فيديو تيك توك خاصاً أو محذوفاً أو مقيّداً للمنطقة، أو قد تكون خدمة التنزيل غير متاحة مؤقتاً. تأكد من أن الفيديو عام، وانسخ رابطه من زر المشاركة في تيك توك، ثم حاول مرة أخرى.",
  },
];

function AppInner() {
  const { push } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    if (typeof window === "undefined") return "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchLog, setBatchLog] = useState<BatchLog[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const resolving = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    storeTheme(theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#07070e" : "#f6f7fb");
  }, [theme]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const persistHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
  }, []);

  const addToHistory = useCallback(
    (media: MediaResult) => {
      setHistory((current) => upsertHistory(current, historyItemFromResult(media)));
    },
    [],
  );

  /* ---------------------------- التحليل ---------------------------- */
  const handleSubmit = useCallback(
    async (value: string) => {
      if (resolving.current) return;
      const rawLinks = value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (!rawLinks.length) {
        push({ kind: "error", title: "أدخل رابط تيك توك أولاً", description: "الصق رابط الفيديو في الحقل أعلاه." });
        return;
      }

      const normalized = rawLinks.map(normalizeTikTokUrl);
      if (normalized.some((link) => link === null)) {
        setResult(null);
        setBatchLog([]);
        setError(TIKTOK_ONLY_MESSAGE);
        push({
          kind: "error",
          title: "روابط تيك توك فقط",
          description: TIKTOK_ONLY_MESSAGE,
        });
        return;
      }

      const links = [...new Set(normalized.filter((link): link is string => link !== null))];
      resolving.current = true;
      setLoading(true);
      setError(null);
      setResult(null);
      setBatchLog([]);

      try {
        const log: BatchLog[] = [];
        let lastResult: MediaResult | null = null;
        for (let index = 0; index < links.length; index += 1) {
          // TikWM's free endpoint allows one request per second.
          if (index > 0) await new Promise((resolve) => window.setTimeout(resolve, 1100));
          const outcome = await resolveMedia(links[index]);
          if (outcome.result) {
            lastResult = outcome.result;
            log.push({ url: links[index], ok: true, title: outcome.result.title });
            addToHistory(outcome.result);
          } else {
            const message = outcome.error ?? "تعذّر جلب فيديو تيك توك. حاول مرة أخرى.";
            log.push({ url: links[index], ok: false, message });
            if (links.length === 1) {
              setError(message);
            }
          }
          if (links.length > 1) setBatchLog([...log]);
        }
        setResult(lastResult);
        const successCount = log.filter((entry) => entry.ok).length;
        push({
          kind: successCount ? "success" : "error",
          title: links.length === 1
            ? successCount ? "مقطع تيك توك جاهز للتنزيل" : "تعذّر جلب المقطع"
            : `تمت معالجة ${links.length} رابط تيك توك`,
          description: links.length === 1
            ? successCount ? "اختر جودة الفيديو لبدء التنزيل." : log[0].message
            : `نجح ${successCount} · فشل ${links.length - successCount}`,
        });
      } catch {
        const message = "تعذّر إكمال الطلب. حاول مرة أخرى.";
        setError(message);
        push({ kind: "error", title: "حدث خطأ", description: message });
      } finally {
        resolving.current = false;
        setLoading(false);
      }
    },
    [addToHistory, push],
  );

  /* ---------------------------- التنزيل ---------------------------- */
  const handleDownload = useCallback(
    async (option: DownloadOption) => {
      setProgress((current) => ({ ...current, [option.key]: 1 }));
      try {
        const mode = await downloadMedia(option.url, option.filename, (update) => {
          setProgress((current) => ({ ...current, [option.key]: update.percent }));
        });
        push({
          kind: "success",
          title: mode === "blob" ? "تم بدء التنزيل" : "تم فتح الملف في تبويب جديد",
          description:
            mode === "blob"
              ? `${option.label} · ${option.filename}`
              : "احفظ الملف من التبويب المفتوح (بسبب قيود الحماية على الخادم).",
        });
      } catch {
        push({ kind: "error", title: "تعذّر التنزيل", description: "حاول مرة أخرى أو انسخ الرابط مباشرة." });
      } finally {
        window.setTimeout(() => {
          setProgress((current) => {
            const next = { ...current };
            delete next[option.key];
            return next;
          });
        }, 1400);
      }
    },
    [push],
  );

  const handleRedownload = useCallback(
    async (item: HistoryItem) => {
      if (item.platform !== "tiktok" || !normalizeTikTokUrl(item.url) || !item.videoUrl) {
        push({ kind: "error", title: "رابط تيك توك غير متاح", description: "أعد تحليل رابط فيديو تيك توك أولاً." });
        return;
      }
      await handleDownload({
        key: `history-${item.id}`,
        label: "مقطع محفوظ",
        hint: "",
        icon: "video",
        url: item.videoUrl,
        filename: `${safeFilename(item.title, "maqta3")}.mp4`,
        accent: "from-brand-500 to-violet-500",
      });
    },
    [handleDownload, push],
  );

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      const ok = await copyText(value);
      push(
        ok
          ? { kind: "success", title: "تم نسخ الرابط", description: label }
          : { kind: "error", title: "تعذّر النسخ", description: "انسخ الرابط يدوياً من بطاقة التنزيل." },
      );
    },
    [push],
  );

  const handleShare = useCallback(
    async (media: MediaResult) => {
      const shareData = {
        title: media.title,
        text: `شاهد هذا المقطع: ${media.title}`,
        url: media.sourceUrl,
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }
      } catch {
        /* المستخدم ألغى المشاركة */
        return;
      }
      await handleCopy(media.sourceUrl, "تم نسخ رابط المقطع للمشاركة");
    },
    [handleCopy],
  );

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900 transition-colors duration-300 dark:bg-[#07070e] dark:text-slate-100">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
        historyCount={history.length}
        onScrollTo={scrollTo}
      />

      <main>
        <Hero />

        <SearchPanel
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {error ? (
          <section className="mt-6 px-4 sm:px-6">
            <div role="alert" className="mx-auto max-w-4xl rounded-2xl border border-rose-500/30 bg-rose-500/8 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
              <div className="flex items-start gap-3">
                <Icon name="close" className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                <div>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {batchLog.length ? (
          <section className="mt-6 px-4 sm:px-6">
            <div className="mx-auto max-w-4xl rounded-2xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="mb-3 text-sm font-extrabold">نتائج المعالجة الجماعية</p>
              <ul className="space-y-1.5">
                {batchLog.map((entry, index) => (
                  <li
                    key={`${entry.url}-${index}`}
                    className="flex flex-col items-start gap-1 rounded-xl bg-slate-50/80 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:bg-white/5"
                  >
                    <span className="w-full min-w-0 truncate font-semibold sm:w-auto sm:flex-1" dir="ltr">
                      {entry.url}
                    </span>
                    <span
                      className={
                        entry.ok
                          ? "max-w-full break-words font-bold text-emerald-600 sm:max-w-[55%] dark:text-emerald-300"
                          : "max-w-full break-words font-bold text-rose-500 sm:max-w-[55%]"
                      }
                    >
                      {entry.ok ? entry.title : entry.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {result ? (
          <ResultCard
            result={result}
            progress={progress}
            onDownload={handleDownload}
            onCopy={handleCopy}
            onShare={handleShare}
          />
        ) : null}

        <section id="how-it-works" className="scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-extrabold sm:text-3xl">كيف يعمل؟</h2>
              <p className="mx-auto mt-2.5 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                ثلاث خطوات فقط تفصلك عن حفظ المقطع على جهازك.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "انسخ الرابط",
                  text: "افتح الفيديو في تيك توك واضغط على مشاركة، ثم اختر نسخ الرابط.",
                  icon: "copy" as const,
                },
                {
                  step: "02",
                  title: "الصقه هنا",
                  text: "الصق رابط تيك توك المباشر أو المختصر واضغط على جلب المقطع.",
                  icon: "link" as const,
                },
                {
                  step: "03",
                  title: "نزّل المقطع",
                  text: "اختر جودة الفيديو المتاحة واحفظ مقطع تيك توك على جهازك.",
                  icon: "download" as const,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative overflow-hidden rounded-3xl border border-slate-900/8 bg-white/70 p-6 shadow-sm dark:border-white/8 dark:bg-white/4"
                >
                  <span className="absolute -top-4 left-4 text-6xl font-black text-slate-900/5 dark:text-white/5">
                    {item.step}
                  </span>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/25">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <p className="relative mt-4 text-base font-extrabold">{item.title}</p>
                  <p className="relative mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HistoryPanel
          items={history}
          onRedownload={handleRedownload}
          onToggleFavorite={(id) => persistHistory(toggleFavorite(history, id))}
          onRemove={(id) => persistHistory(removeHistoryItem(history, id))}
          onClear={() => {
            persistHistory(clearHistory(history));
            push({ kind: "info", title: "تم مسح السجل", description: "تم الاحتفاظ بالمفضلة." });
          }}
        />

        <section id="faq" className="scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-7 text-center text-2xl font-extrabold sm:text-3xl">
              الأسئلة الشائعة
            </h2>
            <div className="space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-2xl border border-slate-900/8 bg-white/70 px-5 py-4 shadow-sm transition open:border-brand-400/50 dark:border-white/8 dark:bg-white/4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-extrabold">
                    {item.q}
                    <Icon
                      name="chevron"
                      className="h-4.5 w-4.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-8 text-slate-600 dark:text-slate-400">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/8 px-4 py-10 sm:px-6 dark:border-white/8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-violet-500 to-neon-400 text-white shadow-lg shadow-brand-500/25">
                <Icon name="download" className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="text-right">
                <p className="text-base font-extrabold">مقطّع</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  تنزيل فيديوهات تيك توك فقط
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <PlatformIcon id="tiktok" className="h-5 w-5" />
              مخصص لتيك توك · غير تابع للمنصة
            </div>
          </div>

          <p className="mt-8 text-center text-xs leading-7 text-slate-400">
            يُستخدم هذا التطبيق للأغراض الشخصية والتعليمية فقط. احرص على احترام حقوق الملكية
            الفكرية وشروط استخدام تيك توك، وتحميل المحتوى المصرّح به فقط.
            <br />
            يُرسل رابط الفيديو إلى خدمة TikWM لجلب المقطع. يُحفظ سجلك محلياً في متصفحك فقط.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
