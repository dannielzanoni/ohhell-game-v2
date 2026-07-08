import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { applyTheme, getInitialTheme, themes } from '@/theme/theme.js';

const ThemeContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (nextTheme) => {
    const resolved = typeof nextTheme === 'function' ? nextTheme(theme) : nextTheme;
    setThemeState(applyTheme(resolved));
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === themes.DARK ? themes.LIGHT : themes.DARK),
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
