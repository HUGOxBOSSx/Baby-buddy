'use client';

import { POOP_COLOR_CHART } from '@baby-buddy/content';
import { TriageBadge } from '@/components/TriageBadge';

export function PoopColorChart() {
  return (
    <section
      aria-label="Tabla visual de colores de popó"
      className="space-y-3"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-ink-primary">
          Tabla visual de colores de popó
        </h2>
        <p className="text-sm text-ink-secondary">
          Guía rápida para distinguir colores esperados de señales que requieren
          valoración médica.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {POOP_COLOR_CHART.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border-interactive bg-bg-card p-4 space-y-2 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink-primary">
                {item.colorNameMx}
              </h3>
              <TriageBadge level={item.triageLevel} />
            </div>
            <p className="text-xs font-semibold text-brand-text">
              Edad típica: {item.typicalAgeMx}
            </p>
            <p className="text-xs text-ink-secondary">{item.meaningMx}</p>
            <p className="text-xs font-semibold text-ink-primary">
              Qué hacer: {item.actionMx}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
