import type { UserProfile } from '@/hooks/use-auth';

export function getNavigationDisplayName(
  user: Pick<UserProfile, 'nombre' | 'alias' | 'email'> | null | undefined,
  fallback: string,
): string {
  if (user?.nombre?.trim()) {
    return user.nombre.trim();
  }
  if (user?.alias?.trim()) {
    return user.alias.trim();
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return fallback;
}
