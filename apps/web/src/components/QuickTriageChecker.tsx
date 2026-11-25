'use client';

import { useState } from 'react';
import { evaluateTriageHardGates } from '@baby-buddy/core';
import { PhoneCallIcon } from '@/components/Icons';
import { useAppState } from '@/components/ThemeProvider';
import { TriageBadge } from '@/components/TriageBadge';

export function QuickTriageChecker() {
  const { childProfile } = useAppState();
  const [manualMonths, setManualMonths] = useState<number>(2);
  const [tempInput, setTempInput] = useState<string>('');
  const [severeBreathing, setSevereBreathing] = useState(false);
  const [blueLips, setBlueLips] = useState(false);
  const [pauses10s, setPauses10s] = useState(false);
  const [seizure, setSeizure] = useState(false);
  const [unresponsive, setUnresponsive] = useState(false);
  const [noWetDiapers8h, setNoWetDiapers8h] = useState(false);

  const ageMonths = childProfile ? childProfile.ageMonths : manualMonths;
  const parsedTemp = Number.parseFloat(tempInput);
  const tempC =
    tempInput.trim().length > 0 && Number.isFinite(parsedTemp)
      ? parsedTemp
      : undefined;

  const result = evaluateTriageHardGates({
    ageMonths,
    tempC,
    severeBreathingDistress: severeBreathing,
    blueLips,
    breathingPausesOver10s: pauses10s,
    seizure,
    unresponsive,
    noWetDiapers8h,
  });

  return (
    <section
      aria-label="Semáforo rápido 3:00 AM"
      className="rounded-2xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink-primary">
          Semáforo rápido: ¿debo preocuparme?
        </h2>
        <TriageBadge level={result.level} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {childProfile ? (
          <div className="rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-xs">
            Edad aplicada: <strong>{childProfile.ageMonths} meses</strong> (
            {childProfile.nicknameMx})
          </div>
        ) : (
          <label className="block text-xs font-semibold text-ink-primary">
            Edad del bebé (meses, 0–72)
            <input
              type="number"
              min={0}
              max={72}
              value={manualMonths}
              onChange={(e) =>
                setManualMonths(
                  Math.max(0, Math.min(72, Number.parseInt(e.target.value, 10) || 0)),
                )
              }
              className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
            />
          </label>
        )}

        <label className="block text-xs font-semibold text-ink-primary">
          Temperatura en °C (opcional)
          <input
            type="number"
            step="0.1"
            min={34}
            max={43}
            placeholder="Ej. 38.2"
            value={tempInput}
            onChange={(e) => setTempInput(e.target.value)}
            className="mt-1 block min-h-12 w-full rounded-xl border border-border-interactive bg-bg-elevated px-3 py-2 text-sm text-ink-primary"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          {
            label: 'Hunde costillas / aleteo nasal (en reposo)',
            checked: severeBreathing,
            toggle: () => setSevereBreathing((v) => !v),
          },
          {
            label: 'Labios azules o morados',
            checked: blueLips,
            toggle: () => setBlueLips((v) => !v),
          },
          {
            label: 'Pausas al respirar >10 s',
            checked: pauses10s,
            toggle: () => setPauses10s((v) => !v),
          },
          {
            label: 'Convulsión',
            checked: seizure,
            toggle: () => setSeizure((v) => !v),
          },
          {
            label: 'No despierta / muy flácido',
            checked: unresponsive,
            toggle: () => setUnresponsive((v) => !v),
          },
          {
            label: '>8 h sin mojar pañal',
            checked: noWetDiapers8h,
            toggle: () => setNoWetDiapers8h((v) => !v),
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.toggle}
            aria-pressed={item.checked}
            className={`inline-flex min-h-12 items-center rounded-full border px-3.5 py-2 text-xs font-semibold ${
              item.checked
                ? 'border-alert-red bg-alert-surface text-alert-text'
                : 'border-border-interactive bg-bg-elevated text-ink-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border-interactive bg-bg-elevated p-4 space-y-2">
        <p className="text-sm font-bold text-ink-primary">{result.nextStepMx}</p>
        {result.triggeredRulesMx.length > 0 ? (
          <ul className="list-disc pl-5 text-xs text-ink-secondary space-y-1">
            {result.triggeredRulesMx.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {result.call911Immediately ? (
        <a
          href="tel:911"
          className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-2xl bg-alert-red px-5 py-3 text-sm font-bold text-alert-on hover:opacity-95"
        >
          <PhoneCallIcon className="h-5 w-5 shrink-0" />
          <span>Llamar al 911 de inmediato (Gratis)</span>
        </a>
      ) : null}
    </section>
  );
}
