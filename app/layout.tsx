import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Databricks Data Engineer Associate — Exam Simulator',
  description: 'Practice exam simulator for the Databricks Certified Data Engineer Associate certification.',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    if (stored === 'light') document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} bg-canvas-base text-ink-primary min-h-screen`}>
        <ThemeToggle />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
