"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from "@/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('theme') as Theme;
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
}

function persistTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  apiClient.patch('/api/profile/theme', { theme }).catch(() => { });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const { user } = useUser();
  const hasLocalSave = typeof window !== 'undefined' && localStorage.getItem('theme') !== null;

  useEffect(() => {
    if (hasLocalSave) return;
    if (user?.theme === 'light' || user?.theme === 'dark') {
      setThemeState(user.theme);
      applyThemeToDOM(user.theme);
    }
  }, [user?.theme, hasLocalSave]);

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
    persistTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      applyThemeToDOM(next);
      persistTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
