import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { gameTypes } from '@/services/gameTypesService.js';
import { authService } from '@/services/authService.js';

const ThemeContext = createContext(null);
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

function getStoredLobbyGameType(pathname) {
  const lobbyMatch = pathname.match(/^\/game\/([^/]+)/);

  if (!lobbyMatch) {
    return '';
  }

  return localStorage.getItem(`ohhell_lobby_game_type_${lobbyMatch[1]}`) || '';
}

function getAuthRequestVariant(detail = {}) {
  const pathname = window.location.pathname;
  const gameType = detail.gameType || getStoredLobbyGameType(pathname);

  if (
    gameType === gameTypes.FODINHA_POWER ||
    pathname.startsWith('/hell-hand') ||
    pathname === '/mercenaries' ||
    pathname.startsWith('/mercenaries/') ||
    pathname === '/characters'
  ) {
    return 'hellHand';
  }

  return 'default';
}

function shouldUseRouteAuthGate() {
  return /^\/game\/[^/]+/.test(window.location.pathname);
}

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

function AuthRequiredDialog({ onAuthenticated, open, request }) {
  const { t } = useTranslation();
  const variant = request?.variant || 'default';
  const isHellHand = variant === 'hellHand';

  return (
    <Dialog open={open}>
      <DialogContent
        className={
          isHellHand
            ? 'pointer-events-auto z-[80] max-w-sm border-red-200/15 bg-black/92 p-5 text-stone-100 shadow-2xl shadow-black/60'
            : 'pointer-events-auto z-[80] max-w-sm border-white/10 bg-zinc-950/95 p-5 text-white shadow-2xl shadow-black/50'
        }
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={isHellHand ? 'text-amber-100' : undefined}>
            {t('auth.requiredTitle')}
          </DialogTitle>
          <DialogDescription className={isHellHand ? 'text-red-100/70' : undefined}>
            {t('auth.requiredDescription')}
          </DialogDescription>
        </DialogHeader>

        <LoginCard
          compact={isHellHand}
          variant={variant}
          className={isHellHand ? 'shadow-none' : 'border-white/10 bg-black/30 p-5 shadow-none'}
          onSaved={onAuthenticated}
        />
      </DialogContent>
    </Dialog>
  );
}

export function AppProvider({ children }) {
  const timerIdsRef = useRef(new Map());
  const [isAuthReady, setIsAuthReady] = useState(
    () => !authService.canRestoreAuthSession(),
  );
  const [authRequest, setAuthRequest] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

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

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id,
          message,
          title,
          variant,
        },
      ]);

      if (Number.isFinite(duration) && duration > 0) {
        const timerId = window.setTimeout(() => dismissToast(id), duration);
        timerIdsRef.current.set(id, timerId);
      }

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timerIdsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const handleMissingAuthToken = (event) => {
      if (shouldUseRouteAuthGate()) {
        return;
      }

      setAuthRequest({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        variant: getAuthRequestVariant(event.detail),
      });
    };

    window.addEventListener('ohhell:missing-auth-token', handleMissingAuthToken);

    return () => {
      window.removeEventListener('ohhell:missing-auth-token', handleMissingAuthToken);
    };
  }, []);

  useEffect(() => {
    if (isAuthReady) {
      return undefined;
    }

    let isMounted = true;

    void authService.hydrateAuthSession().finally(() => {
      if (isMounted) {
        setIsAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthReady]);

  const themeValue = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  const toastValue = useMemo(
    () => ({
      dismissToast,
      showToast,
    }),
    [dismissToast, showToast],
  );

  const handleAuthCompleted = useCallback(() => {
    setAuthRequest(null);
    window.dispatchEvent(new CustomEvent('ohhell:auth-completed'));
  }, []);

  return (
    <ThemeContext.Provider value={themeValue}>
      <ToastContext.Provider value={toastValue}>
        {isAuthReady ? children : null}
        <AuthRequiredDialog
          open={Boolean(authRequest)}
          request={authRequest}
          onAuthenticated={handleAuthCompleted}
        />
        <ToastViewport onDismiss={dismissToast} toasts={toasts} />
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within AppProvider');
  }

  return context;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within AppProvider');
  }

  return context;
}
