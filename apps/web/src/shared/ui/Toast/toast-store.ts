import type { ToastRootProps } from "./Toast";

export type ToastTone = NonNullable<ToastRootProps["tone"]>;

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

/**
 * Очередь уведомлений живёт вне React: тост показывают и хуки (`useDownloadFile`),
 * и обработчики мутаций, поэтому стор — самый короткий путь без провайдера.
 */
let toasts: ToastMessage[] = [];
let nextId = 0;

const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

export const subscribeToasts = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const getToastsSnapshot = (): ToastMessage[] => toasts;

export const showToast = ({ title, description, tone = "info" }: ToastInput): string => {
  nextId += 1;
  const id = `cs-toast-${nextId}`;

  toasts = [...toasts, { id, title, description, tone }];
  emit();

  return id;
};

export const showSuccessToast = (title: string, description?: string): string =>
  showToast({ title, description, tone: "success" });

export const showErrorToast = (title: string, description?: string): string =>
  showToast({ title, description, tone: "danger" });

export const dismissToast = (id: string): void => {
  const next = toasts.filter((toast) => toast.id !== id);

  if (next.length === toasts.length) {
    return;
  }

  toasts = next;
  emit();
};

/** Очистка между тестами: изолирует очередь так же, как `resetDb()` изолирует моки. */
export const resetToasts = (): void => {
  if (toasts.length === 0) {
    return;
  }

  toasts = [];
  emit();
};
