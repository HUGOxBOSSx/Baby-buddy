import type { DisclaimerLevel } from '../compliance/disclaimers';

export interface ServiceStubHealth {
  readonly service: 'supabase' | 'gemini' | 'vercel';
  readonly mode: 'offline_stub';
  readonly readyForFutureWiring: true;
  readonly messageMx: string;
}

export class OfflineSupabasePortStub {
  getStatus(): ServiceStubHealth {
    return {
      service: 'supabase',
      mode: 'offline_stub',
      readyForFutureWiring: true,
      messageMx:
        'Adaptador local de almacenamiento activo; sincronización con Supabase diferida a un hito posterior.',
    };
  }

  async pingLocal(): Promise<{ ok: true; mode: 'offline_stub' }> {
    return { ok: true, mode: 'offline_stub' };
  }
}

export class OfflineGeminiAssistantStub {
  getStatus(): ServiceStubHealth {
    return {
      service: 'gemini',
      mode: 'offline_stub',
      readyForFutureWiring: true,
      messageMx:
        'Asistente IA desactivado en modo offline de Hito 1; sin llamadas externas.',
    };
  }

  async askOfflineOrientation(promptMx: string): Promise<{
    replyMx: string;
    disclaimerLevel: Extract<DisclaimerLevel, 'triage_banner'>;
    isLiveAi: false;
  }> {
    const topic = promptMx.trim() || 'cuidado infantil';
    return {
      replyMx: `Modo offline activo (sin conexión externa para "${topic}"). Consulta las guías educativas verificadas, acude con tu pediatra o llama al 911 ante señales de alarma.`,
      disclaimerLevel: 'triage_banner',
      isLiveAi: false,
    };
  }
}

export class OfflineDeploymentInfoStub {
  getStatus(): ServiceStubHealth {
    return {
      service: 'vercel',
      mode: 'offline_stub',
      readyForFutureWiring: true,
      messageMx:
        'Entorno de ejecución local sin despliegue en la nube en Hito 1.',
    };
  }
}
