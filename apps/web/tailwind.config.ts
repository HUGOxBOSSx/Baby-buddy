import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          text: 'var(--brand-text)',
          surface: 'var(--brand-surface)',
          on: 'var(--on-brand-primary)',
        },
        warm: {
          DEFAULT: 'var(--accent-warm)',
          text: 'var(--accent-warm-text)',
          surface: 'var(--accent-warm-surface)',
          on: 'var(--on-accent-warm)',
          secondary: 'var(--accent-secondary)',
        },
        alert: {
          red: 'var(--alert-red)',
          text: 'var(--alert-red-text)',
          surface: 'var(--alert-red-surface)',
          on: 'var(--on-alert-red-text)',
        },
        border: {
          interactive: 'var(--border-interactive)',
        },
        focus: {
          ring: 'var(--focus-ring)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
