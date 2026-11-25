import { describe, expect, it } from 'vitest';
import {
  assertEthicalComplianceConfig,
  DISCLAIMERS_MX,
  ETHICAL_GUARDRAILS,
  loadOfflineEnvConfig,
  LocalAccountLifecycleAdapter,
  MemoryStorageAdapter,
  OfflineDeploymentInfoStub,
  OfflineGeminiAssistantStub,
  OfflineSupabasePortStub,
  validateNonDiagnosticCopy,
  validateSpanishClinicalCopy,
} from '../index';

describe('Apple 1.4.1, Apple 5.1.1(v), Ethical Guardrails & Offline Adapters', () => {
  it('validates all 3 levels of DISCLAIMERS_MX cleanly', () => {
    const levels = ['onboarding_gate', 'guide_header', 'triage_banner'] as const;
    for (const level of levels) {
      const item = DISCLAIMERS_MX[level];
      const check = validateSpanishClinicalCopy(
        `${item.titleMx}. ${item.bodyMx} ${item.emergencyActionLabelMx}`,
      );
      expect(check.valid).toBe(true);
      expect(check.hasImperialUnits).toBe(false);
      expect(check.diagnosticViolations).toEqual([]);
      expect(item.emergencyNumber).toBe('911');
      expect(item.emergencyActionLabelMx).toContain('911');
    }

    expect(DISCLAIMERS_MX.onboarding_gate.requiresExplicitAck).toBe(true);
    expect(DISCLAIMERS_MX.onboarding_gate.bodyMx).toContain('pediatra');
    expect(DISCLAIMERS_MX.guide_header.bodyMx).toContain('pediatra');
  });

  it('catches affirmative diagnosis, prescriptions, anti-doctor copy, and negation bypasses while allowing explicit disclaimers', () => {
    const forbidden = [
      'Con estos síntomas diagnosticamos bronquiolitis.',
      'Este resultado es un diagnóstico médico definitivo.',
      'Te recetamos jarabe cada 8 horas.',
      'Administra 5 ml de paracetamol cada 6 horas.',
      'Esta guía sustituye al pediatra.',
      'Ya no necesitas consultar al pediatra.',
      'Sin duda alguna hoy mismo te diagnosticamos infección.',
      'No solo orientamos sino diagnosticamos tu caso.',
      'Sin exagerar esto sustituye al pediatra.',
      'No dudes que te recetamos jarabe.',
      'no te preocupes y administra 5 ml.',
      'Sin embargo, te recetamos jarabe.',
      'No obstante diagnosticamos bronquiolitis.',
      'No dejes de darle 5 ml cada 6 horas',
      'No olvides darle 10 mg cada 8 horas',
      'Sin pensarlo, dale 5 gotas',
      'Adminístrale 5 ml de paracetamol',
      'Podemos diagnosticarte bronquiolitis',
      'Sustituimos al pediatra en casa',
      'Esta guía sustituye al doctor',
      '¿No te recetamos jarabe?',
      '¿No diagnosticamos bronquiolitis?',
      '¿No sustituye al pediatra?',
      'No darle 5 ml de paracetamol.',
      'Aplícale 3 gotas cada 8 horas.',
      'Dale 2 cucharaditas de jarabe.',
    ];

    for (const bad of forbidden) {
      const res = validateNonDiagnosticCopy(bad);
      expect(res.valid, `Expected rejection for: ${bad}`).toBe(false);
      expect(res.violations.length).toBeGreaterThan(0);
    }

    const allowed = [
      'Esta aplicación no diagnostica enfermedades.',
      'La orientación no sustituye al pediatra.',
      'El contenido no constituye un diagnóstico médico.',
      'No realiza diagnóstico clínico ni prescribe tratamientos.',
      'Esta guía no es un diagnóstico médico ni reemplaza la consulta con tu pediatra.',
      'Orientación educativa sin fines de diagnóstico ni recetar medicamentos.',
      'La aplicación no receta tratamientos ni sustituye al doctor.',
      '¿Tienes dudas? Esta guía no prescribe ni indica dosis de 5 ml.',
    ];

    for (const ok of allowed) {
      const res = validateNonDiagnosticCopy(ok);
      expect(res.valid, `Expected acceptance for: ${ok}`).toBe(true);
    }
  });

  it('enforces ethical guardrails at runtime', () => {
    expect(ETHICAL_GUARDRAILS).toEqual({
      adsOnChildScreens: false,
      paywallOnEmergencyTriage: false,
      dataSellingEnabled: false,
    });
    expect(() => assertEthicalComplianceConfig(ETHICAL_GUARDRAILS)).not.toThrow();

    expect(() =>
      assertEthicalComplianceConfig({
        ...ETHICAL_GUARDRAILS,
        paywallOnEmergencyTriage: true,
      } as unknown as typeof ETHICAL_GUARDRAILS),
    ).toThrow();
  });

  it('executes full Apple 5.1.1(v) local account & data deletion lifecycle without touching unrelated keys', async () => {
    const storage = new MemoryStorageAdapter();
    await storage.setItem('other_app:theme', 'dark');

    const adapter = new LocalAccountLifecycleAdapter(storage);

    const initial = await adapter.getStoredSnapshotSummary();
    expect(initial.itemCount).toBe(0);
    expect(initial.hasActiveProfile).toBe(false);
    expect(await adapter.hasAcceptedOnboardingDisclaimer()).toBe(false);

    await adapter.acceptOnboardingDisclaimer('2026-11-24T23:25:00Z');
    expect(await adapter.hasAcceptedOnboardingDisclaimer()).toBe(true);

    await adapter.seedDemoLocalData('2026-11-24T23:26:00Z');
    const seeded = await adapter.getStoredSnapshotSummary();
    expect(seeded.hasActiveProfile).toBe(true);
    expect(seeded.onboardingAccepted).toBe(true);
    expect(seeded.itemCount).toBe(5);

    await expect(
      adapter.deleteAccountAndData({ confirmedAtIso: '' }),
    ).rejects.toThrow();
    await expect(
      adapter.deleteAccountAndData({ confirmedAtIso: '1' }),
    ).rejects.toThrow();
    await expect(
      adapter.deleteAccountAndData({ confirmedAtIso: '2026-11-24' }),
    ).rejects.toThrow();
    await expect(
      adapter.deleteAccountAndData({ confirmedAtIso: '2026-02-30T12:00:00Z' }),
    ).rejects.toThrow();
    await expect(adapter.acceptOnboardingDisclaimer('1')).rejects.toThrow();

    const deletion = await adapter.deleteAccountAndData({
      confirmedAtIso: '2026-11-24T23:30:00Z',
      reason: 'Prueba de eliminación local',
    });

    expect(deletion).toEqual({
      status: 'deleted_local',
      deletedKeysCount: 5,
      deletedAtIso: '2026-11-24T23:30:00Z',
      remoteSyncPending: false,
    });

    const afterDelete = await adapter.getStoredSnapshotSummary();
    expect(afterDelete.itemCount).toBe(0);
    expect(afterDelete.hasActiveProfile).toBe(false);
    expect(await adapter.hasAcceptedOnboardingDisclaimer()).toBe(false);
    expect(await storage.getItem('other_app:theme')).toBe('dark');

    await adapter.seedDemoLocalData('2026-11-24T23:31:00-06:00');
    const [firstConcurrent, secondConcurrent] = await Promise.all([
      adapter.deleteAccountAndData({
        confirmedAtIso: '2026-11-24T23:32:00.123Z',
      }),
      adapter.deleteAccountAndData({
        confirmedAtIso: '2026-11-24T23:32:01Z',
      }),
    ]);
    expect(
      firstConcurrent.deletedKeysCount + secondConcurrent.deletedKeysCount,
    ).toBe(5);
    expect(firstConcurrent.deletedKeysCount).toBe(5);
    expect(secondConcurrent.deletedKeysCount).toBe(0);
    expect(await storage.getItem('other_app:theme')).toBe('dark');
  });

  it('loads offline env config and runs service stubs strictly locally', async () => {
    const env = loadOfflineEnvConfig({});
    expect(env).toEqual({
      mode: 'offline_local',
      supabaseUrl: null,
      supabaseAnonKeyConfigured: false,
      geminiApiKeyConfigured: false,
      vercelEnv: 'local',
      hasLiveCredentials: false,
    });

    const supabaseStub = new OfflineSupabasePortStub();
    expect(supabaseStub.getStatus().mode).toBe('offline_stub');
    expect(await supabaseStub.pingLocal()).toEqual({
      ok: true,
      mode: 'offline_stub',
    });

    const geminiStub = new OfflineGeminiAssistantStub();
    expect(geminiStub.getStatus().mode).toBe('offline_stub');
    const aiReply = await geminiStub.askOfflineOrientation('fiebre');
    expect(aiReply.isLiveAi).toBe(false);
    expect(aiReply.disclaimerLevel).toBe('triage_banner');
    expect(aiReply.replyMx).toContain('911');

    const vercelStub = new OfflineDeploymentInfoStub();
    expect(vercelStub.getStatus().mode).toBe('offline_stub');
  });
});
