'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BABY_EVENT_OPTIONS_MX,
  type EventLogEntry,
  MX_VACCINE_CHECKLIST,
  STAGE_SPECS,
  buildPediatricianReportText,
  computeAgeMonthsAtTimestamp,
  evaluateTemperatureAlertMx,
  formatGrowthAgeMx,
  getStageForAgeMonths,
  resolveDateRangePreset,
  summarizeDailyLog,
} from '@baby-buddy/core';
import {
  MILESTONE_DOMAIN_LABELS_MX,
  getMilestonesForStage,
} from '@baby-buddy/content';
import { GrowthChartCard } from '@/components/GrowthChartCard';
import { useAppState } from '@/components/ThemeProvider';

type HealthSubTab = 'temperatura' | 'medicamentos' | 'vacunas' | 'crecimiento';

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
    toggleMilestoneCompleted,
  } = useAppState();

  const [subTab, setSubTab] = useState<HealthSubTab>('temperatura');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (
      tab === 'temperatura' ||
      tab === 'medicamentos' ||
      tab === 'vacunas' ||
      tab === 'crecimiento'
    ) {
      const id = window.setTimeout(() => setSubTab(tab), 0);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, []);
  const [tempInput, setTempInput] = useState('36.8');
  const [tempNote, setTempNote] = useState('');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [headCmInput, setHeadCmInput] = useState('');
  const [growthAgeMode, setGrowthAgeMode] = useState<'current' | 'past'>('current');
  const [pastAgeValue, setPastAgeValue] = useState('14');
  const [pastAgeUnit, setPastAgeUnit] = useState<'days' | 'weeks' | 'months'>('days');
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
    const hc = Number.parseFloat(headCmInput);
    if (!Number.isFinite(w) && !Number.isFinite(h) && !Number.isFinite(hc)) {
      return;
    }
    const now = Date.now();
    const birthMs = childProfile?.birthDateIso
      ? new Date(childProfile.birthDateIso).getTime()
      : Number.NaN;
    const currentAgeDays = Number.isFinite(birthMs)
      ? Math.max(0, Math.round((now - birthMs) / 86_400_000))
      : Math.round(ageMonths * 30.4375);

    let ageAtEntryDays = currentAgeDays;
    let ageLabelMx = formatGrowthAgeMx(currentAgeDays);
    let timestampIso = new Date(now).toISOString();

    if (growthAgeMode === 'past') {
      const rawVal = Number.parseFloat(pastAgeValue);
      if (!Number.isFinite(rawVal) || rawVal < 0) return;
      const multiplier =
        pastAgeUnit === 'days' ? 1 : pastAgeUnit === 'weeks' ? 7 : 30.4375;
      ageAtEntryDays = Math.max(0, Math.min(2190, Math.round(rawVal * multiplier)));
      const roundedVal = Math.round(rawVal);
      const unitLabel =
        pastAgeUnit === 'days'
          ? roundedVal === 1
            ? 'día'
            : 'días'
          : pastAgeUnit === 'weeks'
            ? 'sem'
            : roundedVal === 1
              ? 'mes'
              : 'meses';
      ageLabelMx = `${roundedVal} ${unitLabel}`;
      const entryMs = Number.isFinite(birthMs)
        ? birthMs + ageAtEntryDays * 86_400_000
        : now - Math.max(0, currentAgeDays - ageAtEntryDays) * 86_400_000;
      timestampIso = new Date(entryMs).toISOString();
    }

    addGrowthLog({
      id: `growth-${now}`,
      timestampIso,
      weightKg: Number.isFinite(w) ? Math.round(w * 100) / 100 : undefined,
      heightCm: Number.isFinite(h) ? Math.round(h * 10) / 10 : undefined,
      headCircumferenceCm: Number.isFinite(hc)
        ? Math.round(hc * 10) / 10
        : undefined,
      ageAtEntryDays,
      ageLabelMx,
    });
    setWeightInput('');
    setHeightInput('');
    setHeadCmInput('');
  }, [
    addGrowthLog,
    ageMonths,
    childProfile,
    growthAgeMode,
    headCmInput,
    heightInput,
    pastAgeUnit,
    pastAgeValue,
    weightInput,
  ]);

  const stageId = childProfile
    ? childProfile.stageId
    : getStageForAgeMonths(ageMonths);
  const stageMilestones = getMilestonesForStage(stageId);
  const completedMilestoneIds = healthState.completedMilestoneIds ?? [];
  const doneMilestonesCount = stageMilestones.filter((m) =>
    completedMilestoneIds.includes(m.id),
  ).length;

  const summaryToday = summarizeDailyLog(
    dailyLogs,
    resolveDateRangePreset('today'),
  );
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
  const recentEvents = dailyLogs
    .filter((e): e is EventLogEntry => e.kind === 'event')
    .slice(0, 15);
  const latestEvent = recentEvents[0];
  const latestEventLabel = latestEvent
    ? (BABY_EVENT_OPTIONS_MX.find((o) => o.id === latestEvent.eventType)
        ?.labelMx ?? latestEvent.eventType)
    : null;
  const activeDailyAlerts = [
    summaryToday.hydrationAlertMx ?? summary3d.hydrationAlertMx,
    summaryToday.stoolAlertMx ?? summary3d.stoolAlertMx,
  ].filter((a): a is string => Boolean(a));

  const reportText = buildPediatricianReportText({
    profile: childProfile,
    dailySummaryToday: summaryToday,
    dailySummary3d: summary3d,
    dailySummary7d: summary7d,
    dailySummary30d: summary30d,
    recentEvents,
    stageMilestonesSummary: {
      done: doneMilestonesCount,
      total: stageMilestones.length,
      stageLabelMx: STAGE_SPECS[stageId].shortLabel,
    },
    health: healthState,
    generatedAtIso: new Date().toISOString(),
  });

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard may be unavailable in non-HTTPS contexts
    }
  };

  const latestTemp = healthState.temperatures[0];
  const latestGrowth = healthState.growth[0];

  return (
    <div className="space-y-6">
      <section
        aria-label="Bitácora de salud y vacunas"
        className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <h2 className="text-base font-bold text-ink-primary">
          Bitácora de salud
        </h2>

        <div className="flex flex-wrap justify-center gap-2">
          {(
            [
              { id: 'temperatura', label: 'Temperatura' },
              { id: 'medicamentos', label: 'Medicamentos' },
              { id: 'vacunas', label: 'Vacunas' },
              { id: 'crecimiento', label: 'Crecimiento' },
            ] as const
          ).map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                aria-pressed={active}
                className={`inline-flex min-h-9 items-center rounded-full border px-3.5 py-1 text-xs font-bold ${
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

        {subTab === 'temperatura' ? (
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
        ) : null}

        {subTab === 'medicamentos' ? (
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
            Peso (kg), Talla (cm) y Cabeza (cm)
          </h3>

          <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGrowthAgeMode('current')}
                aria-pressed={growthAgeMode === 'current'}
                className={`inline-flex min-h-10 items-center rounded-full border px-3 py-1 text-xs font-bold ${
                  growthAgeMode === 'current'
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                Edad actual
              </button>
              <button
                type="button"
                onClick={() => setGrowthAgeMode('past')}
                aria-pressed={growthAgeMode === 'past'}
                className={`inline-flex min-h-10 items-center rounded-full border px-3 py-1 text-xs font-bold ${
                  growthAgeMode === 'past'
                    ? 'border-brand-primary bg-brand-primary text-brand-on'
                    : 'border-border-interactive bg-bg-elevated text-ink-primary'
                }`}
              >
                Registro pasado
              </button>
            </div>
            {growthAgeMode === 'past' ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="number"
                  min="0"
                  max="2190"
                  value={pastAgeValue}
                  onChange={(e) => setPastAgeValue(e.target.value)}
                  aria-label="Edad en el registro pasado"
                  className="min-h-10 w-20 rounded-xl border border-border-interactive bg-bg-elevated px-3 py-1.5 text-sm text-ink-primary"
                />
                {(
                  [
                    { id: 'days', label: 'Días' },
                    { id: 'weeks', label: 'Semanas' },
                    { id: 'months', label: 'Meses' },
                  ] as const
                ).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setPastAgeUnit(u.id)}
                    aria-pressed={pastAgeUnit === u.id}
                    className={`min-h-10 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                      pastAgeUnit === u.id
                        ? 'border-brand-primary bg-brand-surface text-brand-text'
                        : 'border-border-interactive bg-bg-elevated text-ink-secondary'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.5"
              max="40"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Peso (kg)"
              className="min-h-12 w-28 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
            />
            <input
              type="number"
              step="0.1"
              min="30"
              max="140"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              placeholder="Talla (cm)"
              className="min-h-12 w-28 rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
            />
            <input
              type="number"
              step="0.1"
              min="25"
              max="65"
              value={headCmInput}
              onChange={(e) => setHeadCmInput(e.target.value)}
              placeholder="Cabeza (cm) · opcional"
              aria-label="Medida de cabeza en centímetros (opcional)"
              className="min-h-12 flex-1 min-w-[160px] rounded-xl border border-border-interactive bg-bg-card px-3 py-2 text-sm text-ink-primary"
            />
            <button
              type="button"
              onClick={handleAddGrowth}
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-brand-on"
            >
              Guardar medición
            </button>
          </div>
          {healthState.growth.slice(0, 6).map((g) => {
            const itemAgeLabel =
              g.ageLabelMx ??
              formatGrowthAgeMx(
                computeAgeMonthsAtTimestamp(
                  childProfile?.birthDateIso,
                  g.timestampIso,
                  ageMonths,
                ) * 30.4375,
              );
            return (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-xs"
              >
                <span>
                  <strong className="text-ink-primary">
                    {g.weightKg !== undefined ? `${g.weightKg} kg` : '—'} ·{' '}
                    {g.heightCm !== undefined ? `${g.heightCm} cm` : '—'}
                    {g.headCircumferenceCm !== undefined
                      ? ` · ${g.headCircumferenceCm} cm PC`
                      : ''}
                  </strong>{' '}
                  <span className="text-ink-secondary">
                    · {g.timestampIso.slice(0, 10)} · {itemAgeLabel}
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
            );
          })}
        </div>
      ) : null}
      </section>

      {/* Sección separada: Hitos del desarrollo */}
      <section
        aria-label="Hitos del desarrollo"
        className="rounded-2xl border border-border-subtle bg-bg-card p-5 space-y-3 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-ink-primary">
            Hitos del desarrollo
          </h2>
          <span className="text-xs font-semibold text-brand-text">
            {doneMilestonesCount} de {stageMilestones.length} en{' '}
            {STAGE_SPECS[stageId].shortLabel}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{
              width: `${Math.round((doneMilestonesCount / Math.max(1, stageMilestones.length)) * 100)}%`,
            }}
          />
        </div>
        <div className="space-y-2">
          {stageMilestones.map((m) => {
            const done = completedMilestoneIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMilestoneCompleted(m.id)}
                aria-pressed={done}
                className={`w-full rounded-xl border p-3.5 text-left space-y-1 ${
                  done
                    ? 'border-brand-primary bg-brand-surface'
                    : 'border-border-interactive bg-bg-elevated'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink-primary">
                    {m.titleMx}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-brand-text">
                    {done ? '✓ Logrado' : 'Marcar'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-ink-secondary">
                  {MILESTONE_DOMAIN_LABELS_MX[m.domain]} · {m.ageLabelMx}
                </p>
                <p className="text-xs text-ink-secondary">{m.activityMx}</p>
                <p className="text-[11px] text-ink-muted">{m.watchForMx}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sección separada: Reporte para pediatra */}
      <section
        aria-label="Reporte para pediatra"
        className="rounded-2xl border-2 border-brand-primary bg-bg-card p-5 space-y-4 shadow-sm"
      >
        <div className="space-y-1">
          <h2 className="text-base font-bold text-ink-primary">
            Reporte para pediatra
          </h2>
          <p className="text-xs text-ink-secondary">
            Resumen listo para tu consulta con registros de hoy, promedios
            diarios, eventos, crecimiento, temperaturas, medicamentos, vacunas
            e hitos.
          </p>
        </div>

        {activeDailyAlerts.length > 0 ? (
          <div className="rounded-xl border border-alert-red bg-alert-surface p-3 space-y-1">
            <p className="text-xs font-bold text-alert-text">
              Alertas activas del registro diario
            </p>
            {activeDailyAlerts.map((alert, idx) => (
              <p key={idx} className="text-xs text-alert-text">
                • {alert}
              </p>
            ))}
          </div>
        ) : null}

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-center space-y-1">
            <p className="text-[11px] font-bold uppercase text-ink-secondary">
              Hoy y promedios (3d / 7d / 30d)
            </p>
            <p className="text-xs font-semibold text-ink-primary">
              Hoy: {summaryToday.totalFeeds} tomas · Prom.:{' '}
              {summary3d.avgFeedsPerDay}/d · {summary7d.avgFeedsPerDay}/d ·{' '}
              {summary30d.avgFeedsPerDay}/d
            </p>
            <p className="text-xs text-ink-secondary">
              Sueño prom.: {summary7d.avgSleepMinPerDay} min/d · Pañales:{' '}
              {summary7d.avgWetDiapersPerDay + summary7d.avgDirtyDiapersPerDay}/d
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-center space-y-1">
            <p className="text-[11px] font-bold uppercase text-ink-secondary">
              Eventos recientes
            </p>
            <p className="text-xs font-semibold text-ink-primary">
              {recentEvents.length}{' '}
              {recentEvents.length === 1
                ? 'evento registrado'
                : 'eventos registrados'}
            </p>
            <p className="text-xs text-ink-secondary">
              {latestEvent && latestEventLabel
                ? `Último: ${latestEventLabel} (${latestEvent.timestampIso.slice(0, 16).replace('T', ' ')})`
                : 'Sin reflujo, vómito ni cólicos recientes'}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-center space-y-1">
            <p className="text-[11px] font-bold uppercase text-ink-secondary">
              Crecimiento y fiebre
            </p>
            <p className="text-xs font-semibold text-ink-primary">
              {latestGrowth
                ? `${latestGrowth.weightKg !== undefined ? `${latestGrowth.weightKg} kg` : '—'} · ${latestGrowth.heightCm !== undefined ? `${latestGrowth.heightCm} cm` : '—'}${latestGrowth.headCircumferenceCm !== undefined ? ` · Cabeza ${latestGrowth.headCircumferenceCm} cm` : ''}`
                : 'Sin mediciones'}
            </p>
            <p className="text-xs text-ink-secondary">
              Última temp.:{' '}
              {latestTemp ? `${latestTemp.tempC.toFixed(1)} °C` : 'Sin registro'}
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-elevated p-3 text-center space-y-1">
            <p className="text-[11px] font-bold uppercase text-ink-secondary">
              Vacunas, meds e hitos
            </p>
            <p className="text-xs font-semibold text-ink-primary">
              Vacunas MX: {healthState.completedVaccineIds.length} /{' '}
              {MX_VACCINE_CHECKLIST.length} · Hitos: {doneMilestonesCount} /{' '}
              {stageMilestones.length}
            </p>
            <p className="text-xs text-ink-secondary">
              Medicamentos: {healthState.medications.length} registros
            </p>
          </div>
        </div>

        <details className="rounded-xl border border-border-subtle bg-bg-elevated p-3">
          <summary className="cursor-pointer text-xs font-bold text-brand-text">
            Ver vista previa completa del reporte
          </summary>
          <pre
            data-print-report="true"
            className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-ink-primary"
          >
            {reportText}
          </pre>
        </details>

        <div className="flex flex-wrap justify-center gap-2">
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
      </section>
    </div>
  );
}
