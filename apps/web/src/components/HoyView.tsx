'use client';

import { STAGE_OVERVIEWS } from '@baby-buddy/content';
import { DailyLogPanel } from '@/components/DailyLogPanel';
import { MascotAvatar } from '@/components/MascotAvatar';
import { StageSelector } from '@/components/StageSelector';
import { useAppState } from '@/components/ThemeProvider';

export function HoyView() {
  const { activeStageId, childProfile, themeMode } = useAppState();

  return (
    <div className="space-y-6">
      <header
        className="flex items-center gap-3"
        title={STAGE_OVERVIEWS[activeStageId].headlineMx}
      >
        <MascotAvatar variant="home" size="md" />
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Hoy · {themeMode === 'night_3am' ? 'Modo nocturno' : 'Modo Día'}
          </p>
          <h1 className="text-xl font-bold text-ink-primary sm:text-2xl">
            Registro diario
          </h1>
        </div>
      </header>

      <DailyLogPanel />

      {childProfile ? null : <StageSelector />}
    </div>
  );
}
