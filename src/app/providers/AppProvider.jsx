import { AuthGateProvider } from '@/features/auth/components/AuthGateProvider.jsx';
import { ToastProvider } from '@/features/notifications/ToastProvider.jsx';
import { ThemeProvider } from '@/features/theme/ThemeProvider.jsx';

export function AppProvider({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthGateProvider>{children}</AuthGateProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
