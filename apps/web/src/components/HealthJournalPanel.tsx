'use client';

import { useCallback, useState } from 'react';
import {
  MX_VACCINE_CHECKLIST,
  buildPediatricianReportText,
  evaluateTemperatureAlertMx,
  resolveDateRangePreset,
  summarizeDailyLog,
} from '@baby-buddy/core';
import { GrowthChartCard } from '@/components/GrowthChartCard';
import { useAppState } from '@/components/ThemeProvider';

type HealthSubTab = 'fiebre' | 'vacunas' | 'crecimiento' | 'reporte';

export function HealthJournalPanel() {
  const {
    childProfile,
    dailyLogs,
    healthState,
    addTemperatureLog,
    deleteTemperatureLog,
    addMedicationLog,
    deleteMedicationLog,
    addGrowthLog,
    deleteGrowthLog,
    toggleVaccineCompleted,
  } = useAppState();

  const [subTab, setSubTab] = useState<HealthSubTab>('fiebre');
  const [tempInput, setTempInput] = useState('36.8');
  const [tempNote, setTempNote] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [copied, setCopied] = useState(false);

  const ageMonths = childProfile ? childProfile.ageMonths : 2;
  const parsedTemp = Number.parseFloat(tempInput);
  const tempAlert =
    Number.isFinite(parsedTemp) && tempInput.trim().length > 0
      ? evaluateTemperatureAlertMx(parsedTemp, ageMonths)
      : null;

  const handleAddTemp = useCallback(() => {
    const val = Number.parseFloat(tempInput);
    if (!Number.isFinite(val) || val < 33 || val > 43) return;
    const now = Date.now();
    addTemperatureLog({
      id: `temp-${now}`,
      timestampIso: new Date(now).toISOString(),
      tempC: Math.round(val * 10) / 10,
      noteMx: tempNote.trim() || undefined,
    });
    setTempNote('');
  }, [addTemperatureLog, tempInput, tempNote]);

  const handleAddMed = useCallback(() => {
    if (!medName.trim() || !medDose.trim()) return;
    const now = Date.now();
    addMedicationLog({
      id: `med-${now}`,
      timestampIso: new Date(now).toISOString(),
      nameMx: medName.trim(),
      doseNoteMx: medDose.trim(),
    });
    setMedName('');
    setMedDose('');
  }, [addMedicationLog, medDose, medName]);

  const handleAddGrowth = useCallback(() => {
    const w = Number.parseFloat(weightInput);
    const h = Number.parseFloat(heightInput);
    if (!Number.isFinite(w) && !Number.isFinite(h)) return;
    const now = Date.now();
    addGrowthLog({
      id: `growth-${now}`,
      timestampIso: new Date(now).toISOString(),
      weightKg: Number.isFinite(w) ? Math.round(w * 100) / 100 : undefined,
      heightCm: Number.isFinite(h) ? Math.round(h * 10) / 10 : undefined,
    });
    setWeightInput('');
    setHeightInput('');
  }, [addGrowthLog, heightInput, weightInput]);

  const summary3d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_3_days'),
  );
  const summary7d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_7_days'),
  );
  const summary30d = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('last_30_days'),
  );
  const reportText = buildPediatricianReportText({
    profile: childProfile,
    dailySummary3d: summary3d,
    dailySummary7d: summary7d,
    dailySummary30d: summary30d,
    health: healthState,
    generatedAtIso: new Date().toISOString(),
  });

  const handleCopyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard may be unavailable in non-HTTPS contexts
    }
  }, [reportText]);

  return (
    <section
      aria-label="Bitácora de salud, vacunas y reporte para pediatra"
      className="rounded-3xl border border-border-interactive bg-bg-card p-5 space-y-4 shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-ink-primary">
          Bitácora de salud y Cartilla MX
        </h2>
        <p className="text-xs text-ink-secondary">
          Registra temperatura (°C), medicamentos indicados por tu pediatra,
          vacunas, crecimiento (kg/cm) y genera un reporte listo para consulta.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'fiebre', label: 'Fiebre y Meds' },
            { id: 'vacunas', label: 'Vacunas MX' },
            { id: 'crecimiento', label: 'Crecimiento (kg/cm)' },
            { id: 'reporte', label: 'Reporte Pediatra' },
          ] as const
        ).map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs font-bold ${
                active
                  ? 'border-brand-primary bg-brand-primary text-brand-on'
                  : 'border-border-interactive bg-bg-elevated text-ink-primary'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {subTab === 'fiebre' ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
            <h3 className="text-sm font-bold text-ink-primary">
              Registro de temperatura (°C)
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="33"
                max="43"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                aria-label="Temperatura en °C"
                className="min-h-12 w-28 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
              />
              <input
                type="text"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="Nota breve (opcional)"
                className="min-h-12 flex-1 min-w-[160px] rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
              />
              <button
                type="button"
                onClick={handleAddTemp}
                className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
              >
                Guardar °C
              </button>
            </div>
            {tempAlert ? (
              <p
                className={`rounded-xl border p-2.5 text-xs font-semibold ${
                  tempAlert.level === 'urgent_911'
                    ? 'border-alert-red bg-alert-surface text-alert-text'
                    : tempAlert.level === 'caution'
                      ? 'border-warm bg-warm-surface text-warm-text'
                      : 'border-border-interactive bg-bg-card text-ink-secondary'
                }`}
              >
                {tempAlert.messageMx}
              </p>
            ) : null}
            {healthState.temperatures.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-xs"
              >
                <span>
                  <strong className="text-ink-primary">{t.tempC.toFixed(1)} °C</strong>{' '}
                  <span className="text-ink-secondary">
                    · {t.timestampIso.slice(0, 16).replace('T', ' ')}
                    {t.noteMx ? ` · ${t.noteMx}` : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteTemperatureLog(t.id)}
                  className="text-[11px] font-semibold text-ink-secondary hover:text-alert-text"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-4 space-y-3">
            <h3 className="text-sm font-bold text-ink-primary">
              Medicamentos (solo registro, según indicación de tu pediatra)
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Medicamento"
                className="min-h-12 flex-1 min-w-[140px] rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
              />
              <input
                type="text"
                value={medDose}
                onChange={(e) => setMedDose(e.target.value)}
                placeholder="Dosis indicada (ej. 2.5 ml)"
                className="min-h-12 flex-1 min-w-[140px] rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
              />
              <button
                type="button"
                onClick={handleAddMed}
                className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
              >
                Registrar toma
              </button>
            </div>
            {healthState.medications.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-xs"
              >
                <span>
                  <strong className="text-ink-primary">{m.nameMx}</strong> ({m.doseNoteMx}){' '}
                  <span className="text-ink-secondary">
                    · {m.timestampIso.slice(0, 16).replace('T', ' ')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteMedicationLog(m.id)}
                  className="text-[11px] font-semibold text-ink-secondary hover:text-alert-text"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {subTab === 'vacunas' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-brand-text">
              {healthState.completedVaccineIds.length} de {MX_VACCINE_CHECKLIST.length} aplicadas (referencia Cartilla Nacional de Vacunación MX)
            </p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-brand-primary transition-all"
                style={{
                  width: `${Math.round((healthState.completedVaccineIds.length / MX_VACCINE_CHECKLIST.length) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {MX_VACCINE_CHECKLIST.map((vac) => {
              const done = healthState.completedVaccineIds.includes(vac.id);
              return (
                <button
                  key={vac.id}
                  type="button"
                  onClick={() => toggleVaccineCompleted(vac.id)}
                  aria-pressed={done}
                  className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${
                    done
                      ? 'border-brand-primary bg-brand-surface text-brand-text'
                      : 'border-border-interactive bg-bg-elevated text-ink-primary'
                  }`}
                >
                  <span>
                    <strong className="block">{vac.nameMx}</strong>
                    <span className="text-[11px] text-ink-secondary">
                      {vac.ageLabelMx}
                    </span>
                  </span>
                  <span className="font-bold">{done ? '✓ Aplicada' : 'Marcar'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {subTab === 'crecimiento' ? (
        <div className="space-y-3 rounded-2xl border border-border-subtle bg-bg-elevated p-4">
          <GrowthChartCard
            entries={healthState.growth}
            birthDateIso={childProfile?.birthDateIso}
            fallbackAgeMonths={ageMonths}
            sex={childProfile?.sex}
          />
          <h3 className="text-sm font-bold text-ink-primary">
            Peso (kg) y Talla (cm)
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="40"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Peso (kg)"
              className="min-h-12 w-32 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
            />
            <input
              type="number"
              step="0.1"
              min="30"
              max="140"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="Talla (cm)"
              className="min-h-12 w-32 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
            />
            <button
              type="button"
              onClick={handleAddGrowth}
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
            >
              Guardar medición
            </button>
          </div>
          {healthState.growth.slice(0, 6).map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-xs"
            >
              <span>
                <strong className="text-ink-primary">
                  {g.weightKg !== undefined ? `${g.weightKg} kg` : '—'} ·{' '}
                  {g.heightCm !== undefined ? `${g.heightCm} cm` : '—'}
                </strong>{' '}
                <span className="text-ink-secondary">
                  · {g.timestampIso.slice(0, 10)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => deleteGrowthLog(g.id)}
                className="text-[11px] font-semibold text-ink-secondary hover:text-alert-text"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {subTab === 'reporte' ? (
        <div className="space-y-3">
          <pre
            data-print-report="true"
            className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border-interactive bg-bg-elevated p-4 text-xs text-ink-primary"
          >
            {reportText}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyReport()}
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
            >
              {copied ? '✓ Reporte copiado' : 'Copiar reporte para pediatra'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-12 items-center rounded-xl border border-border-interactive bg-bg-elevated px-4 py-2 text-xs font-bold text-ink-primary hover:bg-brand-surface"
            >
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
