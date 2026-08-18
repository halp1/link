export interface Toast {
  id: string;
  type: "error" | "success" | "loading";
  message: string;
}

let toasts = $state<Toast[]>([]);

const add = (type: Toast["type"], message: string, autoDismiss = true) => {
  const id = crypto.randomUUID();
  if (toasts.length >= 5) toasts = toasts.slice(1);
  toasts = [...toasts, { id, type, message }];
  if (autoDismiss) setTimeout(() => dismiss(id), 4000);
  return id;
};

const dismiss = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
};

export const notifications = {
  get toasts() {
    return toasts;
  },
  error: (message: string) => add("error", message),
  success: (message: string) => add("success", message),
  loading: (message: string): (() => void) => {
    const id = add("loading", message, false);
    return () => dismiss(id);
  },
  dismiss
};
