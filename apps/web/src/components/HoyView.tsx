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
        <MascotAvatar variant="home" size="lg" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
            Hoy · {themeMode === 'night_3am' ? 'Modo nocturno activo' : 'Modo Día Calma'}
          </p>
          <h1 className="text-2xl font-bold text-ink-primary sm:text-3xl">
            Registro diario
          </h1>
        </div>
      </header>

      <DailyLogPanel />

      {childProfile ? null : <StageSelector />}
    </div>
  );
}
