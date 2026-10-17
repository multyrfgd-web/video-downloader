import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "./Icons";

export type ToastKind = "success" | "error" | "info";

export interface ToastPayload {
  kind?: ToastKind;
  title: string;
  description?: string;
}

interface ToastItem extends Required<Omit<ToastPayload, "description">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  push: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast يجب أن يُستخدم داخل ToastProvider");
  return context;
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (payload: ToastPayload) => {
      counter += 1;
      const id = counter;
      const item: ToastItem = {
        id,
        kind: payload.kind ?? "info",
        title: payload.title,
        description: payload.description,
      };
      setToasts((current) => [...current.slice(-1), item]);
      window.setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-5 z-[80] flex w-[min(92vw,22rem)] flex-col gap-2.5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto hidden items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl animate-rise last:flex sm:flex motion-reduce:animate-none",
              toast.kind === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
              toast.kind === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200",
              toast.kind === "info" && "border-brand-500/30 bg-brand-500/10 text-brand-900 dark:text-brand-100",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                toast.kind === "success" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
                toast.kind === "error" && "bg-rose-500/20 text-rose-600 dark:text-rose-300",
                toast.kind === "info" && "bg-brand-500/20 text-brand-600 dark:text-brand-300",
              )}
            >
              <Icon
                name={toast.kind === "success" ? "check" : toast.kind === "error" ? "close" : "sparkles"}
                className="h-4 w-4"
                strokeWidth={2.2}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 opacity-80">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              className="rounded-lg p-1 opacity-60 transition hover:opacity-100"
              aria-label="إغلاق التنبيه"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
