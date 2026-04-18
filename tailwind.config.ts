import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red:     '#FF3621',
          dark:    '#1C2526',
          surface: '#2D3748',
          border:  '#4A5568',
        },
        status: {
          pass: '#48BB78',
          fail: '#FC8181',
          warn: '#ECC94B',
          flag: '#F6AD55',
        },
        canvas: {
          base:     'var(--canvas-base)',
          surface:  'var(--canvas-surface)',
          elevated: 'var(--canvas-elevated)',
          hover:    'var(--canvas-hover)',
          sunken:   'var(--canvas-sunken)',
        },
        ink: {
          primary:   'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted:     'var(--ink-muted)',
          subtle:    'var(--ink-subtle)',
        },
        line: {
          DEFAULT: 'var(--line-default)',
          subtle:  'var(--line-subtle)',
          strong:  'var(--line-strong)',
        },
      },
    },
  },
  plugins: [],
};
export default config;
