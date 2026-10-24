import { BellRing, CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  type ToastApi,
  ToastContext,
  type ToastOptions,
  type ToastRecord,
  type ToastTone,
} from './ToastContext';

const DEFAULT_TOAST_DURATION = 5000;

const toneLabels: Record<ToastTone, string> = {
  success: 'Success',
  error: 'Error',
  info: 'Info',
  warning: 'Warning',
};

const toneIcons = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
  warning: TriangleAlert,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current;
      const duration = options.duration ?? DEFAULT_TOAST_DURATION;
      const toast: ToastRecord = {
        id,
        title: options.title,
        message: options.message,
        tone: options.tone ?? 'info',
        duration,
      };
      setToasts((current) => [...current, toast]);
      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, message, options) =>
        show({ title, message, tone: 'success', duration: options?.duration }),
      error: (title, message, options) =>
        show({ title, message, tone: 'error', duration: options?.duration }),
      info: (title, message, options) =>
        show({ title, message, tone: 'info', duration: options?.duration }),
      warning: (title, message, options) =>
        show({ title, message, tone: 'warning', duration: options?.duration }),
    }),
    [dismiss, show],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-viewport" aria-label="Notifications" aria-live="polite">
          {toasts.length > 1 && (
            <div className="toast-stack-head">
              <BellRing size={13} />
              <span>{toasts.length} notifications</span>
            </div>
          )}
          <div className="toast-list">
            {toasts.map((toast) => {
              const Icon = toneIcons[toast.tone];
              return (
                <article
                  className={`toast toast-${toast.tone}`}
                  key={toast.id}
                  role="status"
                  aria-label={`${toneLabels[toast.tone]}: ${toast.title}`}
                >
                  <span className="toast-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <div className="toast-copy">
                    <span className="toast-state">{toneLabels[toast.tone]}</span>
                    <b>{toast.title}</b>
                    {toast.message && <p>{toast.message}</p>}
                  </div>
                  <button
                    className="toast-close"
                    type="button"
                    aria-label={`Dismiss ${toast.title}`}
                    onClick={() => dismiss(toast.id)}
                  >
                    <X size={14} />
                  </button>
                  {toast.duration > 0 && (
                    <span
                      className="toast-progress"
                      style={{ animationDuration: `${toast.duration}ms` }}
                      aria-hidden="true"
                    />
                  )}
                </article>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
