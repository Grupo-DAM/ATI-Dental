import type { UserProfile } from '@/hooks/use-auth';

export const USER_ROLES = {
  ODONTOLOGO: 'odontologo',
  ASISTENTE: 'asistente',
  ADMIN: 'admin',
  MEDICO: 'medico',
  USUARIO_EXTERNO: 'usuario_externo',
} as const;

/** Valor legacy en Firestore; sigue reconocido por compatibilidad. */
export const LEGACY_ADMIN_ROLE = 'administrador';

export type AppUserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES] | (string & {});

export function isAdminUser(user: UserProfile | null | undefined): boolean {
  return user?.rol === USER_ROLES.ADMIN || user?.rol === LEGACY_ADMIN_ROLE;
}

export function getRoleLabelKey(rol: AppUserRole | undefined): string {
  switch (rol) {
    case USER_ROLES.ODONTOLOGO:
      return 'navigation.roles.odontologo';
    case USER_ROLES.ASISTENTE:
      return 'navigation.roles.asistente';
    case USER_ROLES.ADMIN:
    case LEGACY_ADMIN_ROLE:
      return 'navigation.roles.admin';
    case USER_ROLES.MEDICO:
      return 'navigation.roles.medico';
    case USER_ROLES.USUARIO_EXTERNO:
      return 'navigation.roles.usuarioExterno';
    default:
      return 'navigation.roles.default';
  }
}
