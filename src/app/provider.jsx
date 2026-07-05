import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { migrateApplicationStorage } from '@/infrastructure/storage/migrations.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

const ThemeContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    migrateApplicationStorage();
    return storage.getItem(storageKeys.theme) || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    storage.setItem(storageKeys.theme, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within AppProvider');
  }

  return context;
}
