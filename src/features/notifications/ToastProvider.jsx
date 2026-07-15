import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 6000;

const toastVariantStyles = {
  error: {
    className: 'border-destructive/50 bg-zinc-950/95 text-destructive',
    icon: XCircle,
    role: 'alert',
  },
  info: {
    className: 'border-sky-300/50 bg-zinc-950/95 text-sky-50',
    icon: Info,
    role: 'status',
  },
  success: {
    className: 'border-emerald-300/50 bg-zinc-950/95 text-emerald-50',
    icon: CheckCircle2,
    role: 'status',
  },
  warning: {
    className: 'border-amber-300/50 bg-zinc-950/95 text-amber-50',
    icon: AlertCircle,
    role: 'status',
  },
};

function ToastViewport({ onDismiss, toasts }) {
  const { t } = useTranslation();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed left-1/2 top-4 z-[100] grid w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 gap-2 md:left-auto md:right-4 md:translate-x-0">
      {toasts.map((toast) => {
        const variant = toastVariantStyles[toast.variant] || toastVariantStyles.info;
        const Icon = variant.icon;

        return (
          <div
            key={toast.id}
            role={variant.role}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl shadow-black/30 backdrop-blur ${variant.className}`}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
              <p className={toast.title ? 'mt-0.5' : ''}>{toast.message}</p>
            </div>
            <button
              type="button"
              className="rounded p-0.5 opacity-75 transition hover:opacity-100"
              aria-label={t('common.close')}
              onClick={() => onDismiss(toast.id)}
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }) {
  const timerIdsRef = useRef(new Map());
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    const timerId = timerIdsRef.current.get(id);

    if (timerId) {
      window.clearTimeout(timerId);
      timerIdsRef.current.delete(id);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ duration = TOAST_DURATION_MS, message, title, variant = 'info' } = {}) => {
      if (!message) {
        return null;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((currentToasts) => [...currentToasts, { id, message, title, variant }]);

      if (Number.isFinite(duration) && duration > 0) {
        const timerId = window.setTimeout(() => dismissToast(id), duration);
        timerIdsRef.current.set(id, timerId);
      }

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const timerIds = timerIdsRef.current;

    return () => {
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      timerIds.clear();
    };
  }, []);

  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
