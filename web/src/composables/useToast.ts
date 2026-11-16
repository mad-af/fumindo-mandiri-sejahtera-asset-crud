import { ref } from 'vue';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

// State modul supaya semua komponen memakai satu daftar toast yang sama.
const toasts = ref<Toast[]>([]);
let counter = 0;

export function useToast() {
  function dismiss(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function show(
    type: ToastType,
    title: string,
    message = '',
    timeout = 4000,
  ): number {
    const id = ++counter;
    toasts.value = [...toasts.value, { id, type, title, message }];

    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout);
    }

    return id;
  }

  return {
    toasts,
    dismiss,
    success: (title: string, message = '') =>
      show('success', title, message),
    error: (title: string, message = '') => show('error', title, message),
  };
}
