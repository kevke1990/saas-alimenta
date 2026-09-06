import { createHash } from 'crypto';

export const OVERRIDE_ENGINE_VERSION = '1.3.0';

export type ProfessionalOverrideInput = {
  field: string;
  originalValue?: unknown;
  overrideValue: unknown;
  reason: string;
};

export function validateOverride(input: ProfessionalOverrideInput) {
  const field = String(input.field || '').trim();
  const reason = String(input.reason || '').trim();
  if (!field || field.length > 160) throw new Error('Geef een geldig veld op.');
  if (!reason || reason.length < 10 || reason.length > 4000) throw new Error('Geef een professionele onderbouwing van minimaal 10 tekens.');
  if (input.overrideValue === undefined) throw new Error('Een overridewaarde is verplicht.');
  return { field, reason, overrideValue: input.overrideValue, originalValue: input.originalValue };
}

export function overrideFingerprint(overrides: ProfessionalOverrideInput[]) {
  return createHash('sha256').update(JSON.stringify(overrides)).digest('hex');
}
