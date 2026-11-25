'use client';

import {
  calculateAgeMonthsFromBirthDate,
  formatChildAgeMx,
} from '@baby-buddy/core';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function clampDate(year: number, month: number, day: number): string {
  const now = new Date();
  const maxY = now.getFullYear();
  const safeY = Math.min(maxY, Math.max(maxY - 6, year));
  const maxM = safeY === maxY ? now.getMonth() + 1 : 12;
  const safeM = Math.min(maxM, Math.max(1, month));
  const daysInMonth = new Date(safeY, safeM, 0).getDate();
  const maxD =
    safeY === maxY && safeM === now.getMonth() + 1
      ? Math.min(daysInMonth, now.getDate())
      : daysInMonth;
  const safeD = Math.min(maxD, Math.max(1, day));
  return `${safeY}-${pad2(safeM)}-${pad2(safeD)}`;
}

export interface BirthDatePickerProps {
  readonly value: string;
  readonly onChange: (ymd: string) => void;
  readonly label?: string;
}

export function BirthDatePicker({
  value,
  onChange,
  label = 'Fecha de nacimiento',
}: BirthDatePickerProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const years = Array.from({ length: 7 }, (_, i) => currentYear - i);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const selYear = match ? Number(match[1]) : currentYear;
  const selMonth = match ? Number(match[2]) : currentMonth;
  const selDay = match ? Number(match[3]) : currentDay;

  const maxMonth = selYear === currentYear ? currentMonth : 12;
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const maxDay =
    selYear === currentYear && selMonth === currentMonth
      ? Math.min(daysInMonth, currentDay)
      : daysInMonth;

  const ageLabel =
    match !== null
      ? (() => {
          try {
            return formatChildAgeMx(calculateAgeMonthsFromBirthDate(value));
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="text-xs font-bold text-ink-primary">{label}</span>
        {ageLabel ? (
          <span className="text-xs font-semibold text-brand-text">
            {ageLabel}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={selYear}
          onChange={(e) =>
            onChange(clampDate(Number(e.target.value), selMonth, selDay))
          }
          aria-label="Año de nacimiento"
          className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-2.5 py-2 text-xs text-ink-primary"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={selMonth}
          onChange={(e) =>
            onChange(clampDate(selYear, Number(e.target.value), selDay))
          }
          aria-label="Mes de nacimiento"
          className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-2.5 py-2 text-xs text-ink-primary"
        >
          {MONTHS_ES.slice(0, maxMonth).map((mLabel, idx) => (
            <option key={mLabel} value={idx + 1}>
              {mLabel}
            </option>
          ))}
        </select>

        <select
          value={selDay}
          onChange={(e) =>
            onChange(clampDate(selYear, selMonth, Number(e.target.value)))
          }
          aria-label="Día de nacimiento"
          className="min-h-11 rounded-xl border border-border-interactive bg-bg-card px-2.5 py-2 text-xs text-ink-primary"
        >
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
