import { Ionicons } from '@expo/vector-icons';
import { USER_ROLES, LEGACY_ADMIN_ROLE } from '@/constants/user-roles';

export type CreatableElementId =
  | 'patient'
  | 'appointment'
  | 'consultation'
  | 'treatment'
  | 'odontogram'
  | 'user';

export interface CreatableElementOption {
  id: CreatableElementId;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  params?: Record<string, any>;
  allowedRoles: string[];
  testID: string;
}

export const ALL_CREATABLE_ELEMENTS: CreatableElementOption[] = [
  {
    id: 'patient',
    labelKey: 'tabs.createModal.patient',
    defaultLabel: 'Nuevo Paciente',
    icon: 'person-add-outline',
    route: 'patients/register-patient',
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE, USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE],
    testID: 'create-opt-patient',
  },
  {
    id: 'appointment',
    labelKey: 'tabs.createModal.appointment',
    defaultLabel: 'Nueva Cita',
    icon: 'calendar-outline',
    route: 'patients/schedule-appointment',
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE, USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE],
    testID: 'create-opt-appointment',
  },
  {
    id: 'consultation',
    labelKey: 'tabs.createModal.consultation',
    defaultLabel: 'Nueva Consulta',
    icon: 'document-text-outline',
    route: 'patients/clinical-history',
    params: { tab: 'consultas', patientId: 'demo-patient' },
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE, USER_ROLES.ODONTOLOGO],
    testID: 'create-opt-consultation',
  },
  {
    id: 'treatment',
    labelKey: 'tabs.createModal.treatment',
    defaultLabel: 'Nuevo Tratamiento',
    icon: 'medkit-outline',
    route: 'patients/register-treatment',
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE, USER_ROLES.ODONTOLOGO],
    testID: 'create-opt-treatment',
  },
  {
    id: 'odontogram',
    labelKey: 'tabs.createModal.odontogram',
    defaultLabel: 'Nuevo Odontograma',
    icon: 'grid-outline',
    route: 'patients/clinical-history',
    params: { tab: 'odontograma', patientId: 'demo-patient' },
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE, USER_ROLES.ODONTOLOGO],
    testID: 'create-opt-odontogram',
  },
  {
    id: 'user',
    labelKey: 'tabs.createModal.user',
    defaultLabel: 'Nuevo Usuario',
    icon: 'shield-checkmark-outline',
    route: 'admin/users',
    allowedRoles: [USER_ROLES.ADMIN, LEGACY_ADMIN_ROLE],
    testID: 'create-opt-user',
  },
];

export function getCreatableOptionsForRole(role?: string): CreatableElementOption[] {
  const normalizedRole = role?.toLowerCase() || '';
  return ALL_CREATABLE_ELEMENTS.filter((option) =>
    option.allowedRoles.includes(normalizedRole)
  );
}

export function isRoleAllowedToCreate(role: string | undefined, optionId: CreatableElementId): boolean {
  const normalizedRole = role?.toLowerCase() || '';
  const option = ALL_CREATABLE_ELEMENTS.find((item) => item.id === optionId);
  if (!option) return false;
  return option.allowedRoles.includes(normalizedRole);
}
