'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  computeTimerElapsedSec,
  formatTimerClock,
} from '@baby-buddy/core';
import { useAppState } from '@/components/ThemeProvider';

export function ActiveTimerBanner() {
  const { activeFeedTimer, activeSleepStartMs, childProfile } = useAppState();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const hasActiveFeed = activeFeedTimer !== null;
  const hasActiveSleep = activeSleepStartMs !== null;

  useEffect(() => {
    if (!hasActiveFeed && !hasActiveSleep) {
      return;
    }
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasActiveFeed, hasActiveSleep]);

  if (!hasActiveFeed && !hasActiveSleep) {
    return null;
  }

  const babySummary = childProfile ? childProfile.nicknameMx : '';

  const feedLabel = activeFeedTimer
    ? `${activeFeedTimer.side === 'breast_left' ? 'Toma Izq' : 'Toma Der'}${activeFeedTimer.paused ? ' (pausa)' : ''} ${formatTimerClock(computeTimerElapsedSec(activeFeedTimer, nowMs))}`
    : null;

  const sleepLabel =
    activeSleepStartMs !== null
      ? `Siesta ${formatTimerClock(Math.max(0, Math.floor((nowMs - activeSleepStartMs) / 1000)))}`
      : null;

  const timerText = [feedLabel, sleepLabel].filter(Boolean).join(' · ');

  return (
    <div
      role="status"
      aria-live="off"
      className="flex items-center justify-between gap-2 border-b border-brand-primary bg-brand-surface px-3 py-1.5 text-xs text-brand-text"
    >
      <p className="min-w-0 truncate font-semibold tabular-nums">
        <span>{timerText}</span>
        {babySummary ? (
          <span className="text-ink-secondary"> · {babySummary}</span>
        ) : null}
      </p>
      <Link
        href="/"
        className="shrink-0 font-bold text-brand-text underline underline-offset-2"
      >
        Ver →
      </Link>
    </div>
  );
}
