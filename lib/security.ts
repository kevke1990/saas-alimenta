import { requireUser } from './auth';
export async function requireMfaReady(){const u=await requireUser();if(u.mfaEnabled&&!u.mfaSecretCipher)throw new Error('MFA_CONFIG_INVALID');return u}
