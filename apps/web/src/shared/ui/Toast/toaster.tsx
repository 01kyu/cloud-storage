"use client";

import { useSyncExternalStore } from "react";

import { ToastClose, ToastDescription, ToastRoot, ToastTitle, ToastViewport } from "./Toast";
import { dismissToast, getToastsSnapshot, subscribeToasts } from "./toast-store";

/**
 * Единственная точка рендера очереди: `ToastProvider` + `ToastViewport` подключены
 * в `app/providers`, поэтому фичам достаточно вызвать `showToast`.
 */
export const Toaster = () => {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsSnapshot);

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <ToastRoot
          key={toast.id}
          tone={toast.tone}
          open
          onOpenChange={(open) => {
            if (!open) {
              dismissToast(toast.id);
            }
          }}
        >
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.description ? <ToastDescription>{toast.description}</ToastDescription> : null}
          <ToastClose />
        </ToastRoot>
      ))}
    </ToastViewport>
  );
};
