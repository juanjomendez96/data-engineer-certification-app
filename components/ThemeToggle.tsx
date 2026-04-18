'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme | null);
    const initial: Theme = stored ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setTheme(initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="fixed top-3 right-3 z-40 w-9 h-9 rounded-full border border-line bg-canvas-surface text-ink-primary shadow-md hover:bg-canvas-hover transition-colors flex items-center justify-center text-base"
    >
      {theme === null ? null : theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
