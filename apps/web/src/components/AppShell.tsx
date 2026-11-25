'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ETHICAL_GUARDRAILS, STAGE_SPECS } from '@baby-buddy/core';
import {
  BookOpenIcon,
  HeartPulseIcon,
  HomeIcon,
  MoonIcon,
  ShirtIcon,
  SunIcon,
} from '@/components/Icons';
import { OnboardingGate } from '@/components/OnboardingGate';
import { useAppState } from '@/components/ThemeProvider';

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: 'home' | 'guides' | 'clothing' | 'health';
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Hoy', icon: 'home' },
  { href: '/guias', label: 'Guías', icon: 'guides' },
  { href: '/ropa-y-clima', label: 'Ropa y Clima', icon: 'clothing' },
  { href: '/salud', label: 'Salud', icon: 'health' },
] as const;

function renderNavIcon(icon: NavItem['icon']) {
  switch (icon) {
    case 'home':
      return <HomeIcon className="h-5 w-5 shrink-0" />;
    case 'guides':
      return <BookOpenIcon className="h-5 w-5 shrink-0" />;
    case 'clothing':
      return <ShirtIcon className="h-5 w-5 shrink-0" />;
    case 'health':
      return <HeartPulseIcon className="h-5 w-5 shrink-0" />;
  }
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { themeMode, toggleTheme, activeStageId, onboardingAccepted } =
    useAppState();
  const isNight = themeMode === 'night_3am';
  const activeStage = STAGE_SPECS[activeStageId];

  const themeToggleLabel = isNight ? 'Cambiar a Modo Día' : 'Activar Modo 3:00 AM';

  if (!onboardingAccepted) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-primary text-ink-primary">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 inline-flex min-h-12 min-w-12 items-center rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-brand-on shadow-lg"
        >
          Saltar al contenido principal
        </a>

        <header className="border-b border-border-interactive bg-bg-card px-4 py-3">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-ink-primary">
                Baby Buddy MX
              </p>
              <p className="text-xs text-ink-secondary">
                Tu compañero de 0 a 6 años
              </p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={isNight}
              aria-label={themeToggleLabel}
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-sm font-semibold text-ink-primary hover:bg-brand-surface"
            >
              {isNight ? (
                <SunIcon className="h-5 w-5 shrink-0 text-warm-text" />
              ) : (
                <MoonIcon className="h-5 w-5 shrink-0 text-brand-text" />
              )}
              <span>{isNight ? 'Modo Día' : 'Modo 3:00 AM'}</span>
            </button>
          </div>
        </header>

        <main
          id="contenido-principal"
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-12"
        >
          <OnboardingGate />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-primary text-ink-primary">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 inline-flex min-h-12 min-w-12 items-center rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-brand-on shadow-lg"
      >
        Saltar al contenido principal
      </a>

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between md:border-r md:border-border-interactive md:bg-bg-card md:p-4">
        <div className="space-y-6">
          <div className="space-y-1 px-2">
            <p className="text-lg font-bold text-ink-primary">Baby Buddy MX</p>
            <p className="text-xs text-ink-secondary">
              Tu compañero de 0 a 6 años
            </p>
            <p className="inline-block rounded-full border border-border-interactive bg-bg-elevated px-2.5 py-0.5 text-xs font-semibold text-brand-text">
              Etapa: {activeStage.shortLabel}
            </p>
          </div>

          <nav aria-label="Navegación principal" className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isRouteActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-12 min-w-12 items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-brand-primary bg-brand-primary text-brand-on'
                      : 'border-transparent bg-transparent text-ink-primary hover:border-border-interactive hover:bg-bg-elevated'
                  }`}
                >
                  {renderNavIcon(item.icon)}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-border-interactive">
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isNight}
            aria-label={themeToggleLabel}
            className="inline-flex min-h-12 min-w-12 w-full items-center justify-center gap-2 rounded-xl border border-border-interactive bg-bg-elevated px-4 py-3 text-sm font-semibold text-ink-primary hover:bg-brand-surface"
          >
            {isNight ? (
              <SunIcon className="h-5 w-5 shrink-0 text-warm-text" />
            ) : (
              <MoonIcon className="h-5 w-5 shrink-0 text-brand-text" />
            )}
            <span>{isNight ? 'Modo Día' : 'Modo 3:00 AM'}</span>
          </button>

          <p className="px-1 text-[11px] leading-snug text-ink-muted">
            Educativo · Local · Sin anuncios (
            {String(ETHICAL_GUARDRAILS.adsOnChildScreens)})
          </p>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Compact Header */}
        <header className="flex items-center justify-between gap-3 border-b border-border-interactive bg-bg-card px-4 py-3 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink-primary">
              Baby Buddy MX
            </p>
            <p className="truncate text-xs text-ink-secondary">
              {activeStage.label} · {isNight ? 'Modo 3:00 AM' : 'Modo Día'}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-brand-primary bg-brand-surface px-3 py-1 text-xs font-semibold text-brand-text">
            {activeStage.shortLabel}
          </span>
        </header>

        <main
          id="contenido-principal"
          tabIndex={-1}
          className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8"
        >
          {children}
        </main>

        <footer className="hidden md:block border-t border-border-interactive bg-bg-card px-8 py-4 text-xs text-ink-muted">
          Baby Buddy MX · Contenido educativo en español de México y unidades
          métricas (°C, kg, cm, ml). Sin anuncios infantiles (
          {String(ETHICAL_GUARDRAILS.adsOnChildScreens)}) · Sin paywall en
          urgencias 911 ({String(ETHICAL_GUARDRAILS.paywallOnEmergencyTriage)}) ·
          Sin venta de datos ({String(ETHICAL_GUARDRAILS.dataSellingEnabled)}).
        </footer>
      </div>

      {/* Mobile Bottom Thumb-Zone Navigation + 1-Tap 3:00 AM Switcher */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-interactive bg-bg-card px-2 py-2 md:hidden">
        <nav
          aria-label="Navegación principal"
          className="grid grid-cols-5 gap-1"
        >
          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition-colors ${
                  active
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-transparent bg-transparent text-ink-primary hover:bg-bg-elevated'
                }`}
              >
                {renderNavIcon(item.icon)}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isNight}
            aria-label={themeToggleLabel}
            className={`flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition-colors ${
              isNight
                ? 'border-warm bg-warm-surface text-warm-text'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            {isNight ? (
              <SunIcon className="h-5 w-5 shrink-0" />
            ) : (
              <MoonIcon className="h-5 w-5 shrink-0" />
            )}
            <span>{isNight ? 'Día' : '3:00 AM'}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
