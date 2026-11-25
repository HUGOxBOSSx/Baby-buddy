export type StatusSeverity = 'normal' | 'caution' | 'urgent_red';
export type StatusIconName = 'check-circle' | 'alert-triangle' | 'alert-octagon';

export interface StatusIndicatorSpec {
  readonly severity: StatusSeverity;
  readonly iconName: StatusIconName;
  readonly labelMx: string;
  readonly descriptionMx: string;
  readonly paywallProtected: false;
}

export const STATUS_SPECS: Record<StatusSeverity, StatusIndicatorSpec> = {
  normal: {
    severity: 'normal',
    iconName: 'check-circle',
    labelMx: 'En casa / Normal',
    descriptionMx: 'Cuidado habitual en casa y observación tranquila.',
    paywallProtected: false,
  },
  caution: {
    severity: 'caution',
    iconName: 'alert-triangle',
    labelMx: 'Vigilar con atención',
    descriptionMx:
      'Observa evolución y consulta a tu pediatra si persiste o empeora.',
    paywallProtected: false,
  },
  urgent_red: {
    severity: 'urgent_red',
    iconName: 'alert-octagon',
    labelMx: 'Urgencia médica — 911',
    descriptionMx:
      'Señal de alerta roja: llama al 911 o acude de inmediato a urgencias.',
    paywallProtected: false,
  },
};

export function getStatusIndicator(
  severity: StatusSeverity,
): StatusIndicatorSpec {
  return STATUS_SPECS[severity];
}
