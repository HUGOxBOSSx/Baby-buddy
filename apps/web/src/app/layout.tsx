import type { Metadata } from 'next';
import { LOCAL_STORAGE_KEYS } from '@baby-buddy/core';
import { AppShell } from '@/components/AppShell';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Baby Buddy MX — Tu compañero de 0 a 6 años',
  description:
    'Orientación educativa de crianza y bienestar infantil en México (0 a 6 años).',
};

const NO_FLASH_INIT_SCRIPT = `(function(){try{var t=window.localStorage.getItem('${LOCAL_STORAGE_KEYS.themeMode}');if(t==='night_3am'){document.documentElement.dataset.theme='night-3am';}var o=window.localStorage.getItem('${LOCAL_STORAGE_KEYS.onboardingAcceptedAt}');if(o&&o.trim().length>0){document.documentElement.dataset.onboarding='accepted';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: NO_FLASH_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-screen antialiased bg-bg-primary text-ink-primary">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
