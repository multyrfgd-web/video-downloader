import { cn } from "@/utils/cn";
import { Icon } from "./Icons";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  historyCount: number;
  onScrollTo: (id: string) => void;
}

const links = [
  { id: "search", label: "التحميل" },
  { id: "how-it-works", label: "طريقة الاستخدام" },
  { id: "history", label: "المحفوظات" },
  { id: "faq", label: "الأسئلة" },
];

export function Header({ theme, onToggleTheme, historyCount, onScrollTo }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/5 bg-white/70 backdrop-blur-xl dark:border-white/5 dark:bg-[#07070e]/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-3 text-right"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-violet-500 to-neon-400 text-white shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105">
            <Icon name="download" className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">مقطّع</span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              TikTok Downloader
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => onScrollTo(link.id)}
              className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onScrollTo("history")}
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-900/10 bg-white/70 text-slate-600 transition hover:border-brand-400 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-300 sm:flex"
            aria-label="المحفوظات"
          >
            <Icon name="list" className="h-5 w-5" />
            {historyCount > 0 ? (
              <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition",
              "border-slate-900/10 bg-white/70 text-slate-600 hover:border-brand-400 hover:text-brand-600",
              "dark:border-white/10 dark:bg-white/5 dark:text-amber-300 dark:hover:text-amber-200",
            )}
            aria-label="تبديل المظهر"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
