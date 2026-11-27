import { suggestNextNapWindowMx, type DailyLogSummary } from './dailyLog';
import { MX_VACCINE_CHECKLIST, type HealthLogState } from './healthLog';
import type { ChildProfileSummary } from './profile';

export type LocalReminderKind = 'vaccine' | 'feed' | 'nap';

export interface LocalReminderItem {
  readonly id: string;
  readonly kind: LocalReminderKind;
  readonly urgency: 'info' | 'due';
  readonly titleMx: string;
  readonly detailMx: string;
}

export function computeLocalRemindersMx(input: {
  readonly profile: ChildProfileSummary | null;
  readonly dailySummary: DailyLogSummary;
  readonly healthState: HealthLogState;
  readonly now?: Date;
}): readonly LocalReminderItem[] {
  const { profile, dailySummary, healthState, now = new Date() } = input;
  const dueItems: LocalReminderItem[] = [];
  const infoItems: LocalReminderItem[] = [];
  const ageMonths = profile ? profile.ageMonths : 2;

  if (profile) {
    const completed = new Set(healthState.completedVaccineIds);
    const dueVaccines = MX_VACCINE_CHECKLIST.filter(
      (vac) => !completed.has(vac.id) && vac.ageMonths <= profile.ageMonths,
    );
    if (dueVaccines.length > 0) {
      const names = dueVaccines
        .slice(0, 2)
        .map((v) => v.nameMx)
        .join(', ');
      dueItems.push({
        id: 'rem-vaccine-due',
        kind: 'vaccine',
        urgency: 'due',
        titleMx: `Vacunas por revisar en Cartilla MX (${dueVaccines.length})`,
        detailMx:
          dueVaccines.length > 2
            ? `${names} y ${dueVaccines.length - 2} más según edad.`
            : `${names} — verifica aplicación con tu pediatra.`,
      });
    } else {
      const upcoming = MX_VACCINE_CHECKLIST.filter(
        (vac) =>
          !completed.has(vac.id) && vac.ageMonths === profile.ageMonths + 1,
      );
      if (upcoming.length > 0) {
        infoItems.push({
          id: 'rem-vaccine-upcoming',
          kind: 'vaccine',
          urgency: 'info',
          titleMx: `Próxima vacuna al mes ${profile.ageMonths + 1}`,
          detailMx: upcoming.map((v) => v.nameMx).join(', '),
        });
      }
    }
  }

  const hoursSinceFeed = dailySummary.hoursSinceLastFeed;
  if (
    hoursSinceFeed !== null &&
    ((ageMonths < 6 && hoursSinceFeed >= 3.5) ||
      (ageMonths < 12 && hoursSinceFeed >= 4.5))
  ) {
    infoItems.push({
      id: 'rem-feed-window',
      kind: 'feed',
      urgency: 'info',
      titleMx: `Lleva ${hoursSinceFeed} h desde la última toma`,
      detailMx: 'Observa señales tempranas de hambre.',
    });
  }

  if (ageMonths < 36 && dailySummary.lastSleepIso) {
    const napText = suggestNextNapWindowMx(
      ageMonths,
      dailySummary.lastSleepIso,
      now,
    );
    if (
      napText.startsWith('Ventana de siesta abierta') ||
      napText.startsWith('Ventana sugerida pasada')
    ) {
      infoItems.push({
        id: 'rem-nap-window',
        kind: 'nap',
        urgency: 'info',
        titleMx: 'Ventana de descanso',
        detailMx: napText,
      });
    }
  }

  return [...dueItems, ...infoItems].slice(0, 3);
}
