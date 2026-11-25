export type DisclaimerLevel =
  | 'onboarding_gate'
  | 'guide_header'
  | 'triage_banner';

export interface DisclaimerContent {
  readonly level: DisclaimerLevel;
  readonly titleMx: string;
  readonly bodyMx: string;
  readonly emergencyNumber: '911';
  readonly emergencyActionLabelMx: string;
  readonly requiresExplicitAck: boolean;
  readonly ackButtonLabelMx?: string;
}

export const DISCLAIMERS_MX: Record<DisclaimerLevel, DisclaimerContent> = {
  onboarding_gate: {
    level: 'onboarding_gate',
    titleMx: 'Aviso importante de orientación infantil',
    bodyMx:
      'Baby Buddy MX ofrece orientación general de crianza y bienestar para niñas y niños de 0 a 6 años en México. Esta aplicación es exclusivamente educativa, no constituye un diagnóstico médico y no sustituye la valoración ni el seguimiento de tu pediatra.',
    emergencyNumber: '911',
    emergencyActionLabelMx:
      'Si observas señales de gravedad, llama de inmediato al 911 o acude a urgencias.',
    requiresExplicitAck: true,
    ackButtonLabelMx: 'Entiendo y acepto continuar',
  },
  guide_header: {
    level: 'guide_header',
    titleMx: 'Información educativa con fuentes revisadas',
    bodyMx:
      'Contenido orientativo basado en guías clínicas de referencia. No diagnostica enfermedades ni reemplaza la consulta con tu pediatra.',
    emergencyNumber: '911',
    emergencyActionLabelMx:
      'Ante duda clínica o urgencia, consulta a tu pediatra o llama al 911.',
    requiresExplicitAck: false,
  },
  triage_banner: {
    level: 'triage_banner',
    titleMx: 'Orientación no diagnóstica — Emergencias 911',
    bodyMx:
      'Esta sección no diagnostica ni prescribe tratamientos. Las señales de alerta roja siempre están disponibles sin costo ni suscripción.',
    emergencyNumber: '911',
    emergencyActionLabelMx:
      'En caso de emergencia médica, llama al 911 de inmediato.',
    requiresExplicitAck: false,
  },
};
