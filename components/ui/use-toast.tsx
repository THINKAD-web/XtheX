"use client";

import * as React from "react";

import {
  Toast,
  ToastDescription,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

type ToastVariant = "default" | "destructive";

type ToastState = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastOptions = Omit<ToastState, "id">;

type ToastContextValue = {
  toasts: ToastState[];
  toast: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    setToasts((prev) => {
      const id = Date.now();
      return [...prev, { id, ...options }];
    });
  }, []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      toast,
      dismiss,
    }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            onClick={() => dismiss(t.id)}
          >
            {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
            {t.description ? (
              <ToastDescription>{t.description}</ToastDescription>
            ) : null}
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

