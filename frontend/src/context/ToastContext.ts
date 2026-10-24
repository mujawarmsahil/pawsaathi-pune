import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
};

export type ToastRecord = {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
  duration: number;
};

type ToastShortcut = (title: string, message?: string, options?: { duration?: number }) => number;

export type ToastApi = {
  show: (options: ToastOptions) => number;
  success: ToastShortcut;
  error: ToastShortcut;
  info: ToastShortcut;
  warning: ToastShortcut;
  dismiss: (id: number) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);
