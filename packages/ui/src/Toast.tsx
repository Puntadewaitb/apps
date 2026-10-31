"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "./cn";

type ToastTone = "info" | "success" | "danger";
type ToastItem = { id: number; message: ReactNode; tone: ToastTone };
type ToastApi = { show: (message: ReactNode, tone?: ToastTone) => void };

const ToastContext = createContext<ToastApi | null>(null);

const tones: Record<ToastTone, string> = {
  info: "bg-fg text-bg",
  success: "bg-success text-white",
  danger: "bg-danger text-white",
};

export function ToastProvider({
  children,
  duration = 4000,
}: {
  children: ReactNode;
  duration?: number;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const show = useCallback(
    (message: ReactNode, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setItems((prev) => [...prev, { id, message, tone }]);
      const t = setTimeout(() => {
        timers.current.delete(t);
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, duration);
      timers.current.add(t);
    },
    [duration],
  );

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 z-60 flex -translate-x-1/2 flex-col gap-2"
      >
        {items.map((i) => (
          <div key={i.id} className={cn("rounded-md px-4 py-2 text-sm shadow-lg", tones[i.tone])}>
            {i.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}
