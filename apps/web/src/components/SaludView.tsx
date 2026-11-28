'use client';

import { HealthJournalPanel } from '@/components/HealthJournalPanel';
import { MascotAvatar } from '@/components/MascotAvatar';

export function SaludView() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <MascotAvatar variant="salud" size="md" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h1 className="text-xl font-bold text-ink-primary sm:text-2xl">
            Salud
          </h1>
          <p className="text-xs text-ink-secondary">
            Temperatura, medicamentos, vacunas, crecimiento, hitos y reporte
          </p>
        </div>
      </header>

      <HealthJournalPanel />
    </div>
  );
}
