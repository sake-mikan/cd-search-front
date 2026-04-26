'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = 'theme-preference';

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // マウント時に一度だけ実行
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'system';
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const computeDark = (mode) => {
      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      return mediaQuery.matches;
    };

    const initialDark = computeDark(saved);
    setIsDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
    setMounted(true);

    const handleChange = () => {
      if (localStorage.getItem(THEME_STORAGE_KEY) === 'system') {
        const dark = mediaQuery.matches;
        setIsDarkMode(dark);
        document.documentElement.classList.toggle('dark', dark);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  // ハイドレーションエラーを防ぐため、マウントされるまで children をレンダリングしない
  // （または透明にしておく）
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        <div style={{ opacity: 0 }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
