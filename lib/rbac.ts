import { requireUser } from './auth';
export type Role = 'PROFESSIONAL'|'PRACTICE_ADMIN'|'ADMIN';
export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  const role = (user.role || (user.isAdmin ? 'ADMIN' : 'PROFESSIONAL')) as Role;
  if (!roles.includes(role)) throw new Error('FORBIDDEN');
  return user;
}
