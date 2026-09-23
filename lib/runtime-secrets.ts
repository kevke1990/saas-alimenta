const MIN_SECRET_LENGTH = 32;

export class MissingRuntimeSecretError extends Error {
  constructor(name: string) {
    super(`Runtime secret ${name} ontbreekt of is te kort`);
    this.name = "MissingRuntimeSecretError";
  }
}

/**
 * Runtime-only secret access.
 * Secrets are deliberately read lazily so production credentials are never
 * required during Next.js build/module collection.
 */
export function requireRuntimeSecret(name: string, minLength = MIN_SECRET_LENGTH) {
  const value = process.env[name];
  if (!value || value.length < minLength) throw new MissingRuntimeSecretError(name);
  return value;
}

export function optionalRuntimeSecret(name: string) {
  const value = process.env[name];
  return value && value.length > 0 ? value : null;
}
