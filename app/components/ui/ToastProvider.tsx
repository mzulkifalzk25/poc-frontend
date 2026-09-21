import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PillTone } from "./Pill";
import { Toast, type ToastMessage } from "./Toast";

const TOAST_DURATION_MS = 3000;

interface ToastContextValue {
  showToast: (text: string, tone?: PillTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, tone: PillTone = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, text, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastContextValue {
  const context = use(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
