import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { firestore } from '@/config/firebase';
import { UserProfile } from '@/hooks/use-auth';
import { USER_ROLES, isAdminUser } from '@/constants/user-roles';
import { parseAppointmentDateKey } from '@/utils/appointment-schedule';

export interface DashboardSummary {
  pendingAppointments: number;
  pendingPatients: number;
  pendingExams: number;
  fromCache?: boolean;
}

export interface QuickAccessItem {
  id: string;
  labelKey: string;
  icon: string;
  route: string;
  allowedRoles: string[];
}

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  read: boolean;
  date?: string;
  type: 'appointment' | 'exam' | 'system';
  targetRoute?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'patients' | 'appointments' | 'treatments' | 'modules';
  route: string;
}

const DASHBOARD_CACHE_KEY = 'dashboard_summary_cache_v1';
const QUICK_ACCESS_KEY = 'dashboard_quick_access_v1';
const NOTIFICATIONS_KEY = 'dashboard_notifications_v1';

export const ALL_QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'agenda',
    labelKey: 'home.agenda',
    icon: 'calendar-outline',
    route: '/(tabs)/agenda',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador', USER_ROLES.MEDICO],
  },
  {
    id: 'patients',
    labelKey: 'home.patients',
    icon: 'people-outline',
    route: '/(tabs)/patients/patients-list',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador', USER_ROLES.MEDICO],
  },
  {
    id: 'treatments',
    labelKey: 'home.treatments',
    icon: 'clipboard-outline',
    route: '/(tabs)/patients/register-treatment',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ADMIN, 'administrador'],
  },
  {
    id: 'registerPatient',
    labelKey: 'home.registerPatient',
    icon: 'person-add-outline',
    route: '/(tabs)/patients/register-patient',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador'],
  },
  {
    id: 'reports',
    labelKey: 'home.reports',
    icon: 'bar-chart-outline',
    route: '/(tabs)/admin/reports',
    allowedRoles: [USER_ROLES.ADMIN, 'administrador'],
  },
  {
    id: 'users',
    labelKey: 'home.users',
    icon: 'shield-checkmark-outline',
    route: '/(tabs)/admin/users',
    allowedRoles: [USER_ROLES.ADMIN, 'administrador'],
  },
  {
    id: 'contact',
    labelKey: 'home.contact',
    icon: 'chatbubbles-outline',
    route: '/(tabs)/contacts',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador', USER_ROLES.MEDICO, USER_ROLES.USUARIO_EXTERNO],
  },
  {
    id: 'profile',
    labelKey: 'home.profile',
    icon: 'person-circle-outline',
    route: '/(tabs)/profile',
    allowedRoles: [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador', USER_ROLES.MEDICO, USER_ROLES.USUARIO_EXTERNO],
  },
];

const DEFAULT_SUMMARY: DashboardSummary = {
  pendingAppointments: 0,
  pendingPatients: 0,
  pendingExams: 0,
  fromCache: false,
};

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Recordatorio de citas',
    subtitle: 'Tienes 3 citas pendientes para hoy',
    read: false,
    date: 'Hoy, 09:00 AM',
    type: 'appointment',
    targetRoute: '/(tabs)/agenda',
  },
];

/**
 * Checks if a given role has access to clinical/patient data.
 */
export function canAccessClinicalData(role?: string | null): boolean {
  if (!role) return false;
  return [USER_ROLES.ODONTOLOGO, USER_ROLES.ASISTENTE, USER_ROLES.ADMIN, 'administrador', USER_ROLES.MEDICO].includes(role as any);
}

/**
 * Checks if a given role has access to treatments/exams data.
 */
export function canAccessTreatments(role?: string | null): boolean {
  if (!role) return false;
  return [USER_ROLES.ODONTOLOGO, USER_ROLES.ADMIN, 'administrador'].includes(role as any);
}

/**
 * Fetches dashboard summary with cache-first and offline resilience,
 * querying Firestore collections dynamically when online.
 */
export async function fetchDashboardSummary(
  user?: UserProfile | null,
  options?: { forceRefresh?: boolean; shouldFail?: boolean }
): Promise<DashboardSummary> {
  if (options?.shouldFail) {
    throw new Error('Network error loading dashboard summary');
  }

  // Try reading from cache first
  let cachedData: DashboardSummary | null = null;
  try {
    const rawCache = await AsyncStorage.getItem(DASHBOARD_CACHE_KEY);
    if (rawCache) {
      cachedData = JSON.parse(rawCache);
    }
  } catch (err) {
    // ignore cache read error
  }

  // Check network state
  let isConnected = true;
  try {
    const netState = await NetInfo.fetch();
    isConnected = Boolean(netState.isConnected);
  } catch (e) {
    isConnected = true;
  }

  if (!isConnected) {
    if (cachedData) {
      return { ...cachedData, fromCache: true };
    }
    return { ...DEFAULT_SUMMARY, fromCache: true };
  }

  let pendingAppointments = 0;
  let pendingPatients = 0;
  let pendingExams = 0;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  try {
    const [citasSnap, pacientesSnap, tratamientosSnap] = await Promise.all([
      firestore().collection('citas').get().catch(() => null),
      firestore().collection('pacientes').get().catch(() => null),
      firestore().collection('tratamientos').get().catch(() => null),
    ]);

    // 1. Citas pendientes para hoy (o citas activas no canceladas/finalizadas)
    if (citasSnap?.docs) {
      pendingAppointments = citasSnap.docs.filter((doc: any) => {
        const a = doc.data() || {};
        const status = String(a.status || a.estado || '').toUpperCase();
        if (status === 'FINALIZADO' || status === 'CANCELADO' || status === 'COMPLETADO') {
          return false;
        }
        if (user?.rol === USER_ROLES.USUARIO_EXTERNO && a.patientId && a.patientId !== user.uid) {
          return false;
        }
        const rawDate = a.date || a.fechaHora || a.fecha;
        if (rawDate) {
          const parsed = parseAppointmentDateKey(String(rawDate));
          if (parsed) {
            return parsed === todayKey;
          }
        }
        return true;
      }).length;
    }

    // 2. Pacientes pendientes
    if (pacientesSnap?.docs) {
      pendingPatients = pacientesSnap.docs.filter((doc: any) => {
        const p = doc.data() || {};
        const st = String(p.status || p.estado || '').toLowerCase();
        if (st === 'pendiente') return true;
        if (st === 'activo' || st === 'inactivo') return false;
        return !p.lastVisit && !p.ultimaVisita && !p.ultima_visita;
      }).length;
    }

    // 3. Exámenes pendientes en tratamientos
    if (tratamientosSnap?.docs) {
      tratamientosSnap.docs.forEach((doc: any) => {
        const t = doc.data() || {};
        if (user?.rol === USER_ROLES.USUARIO_EXTERNO && t.patientId && t.patientId !== user.uid) {
          return;
        }
        if (Array.isArray(t.pendingExams) && t.pendingExams.length > 0) {
          pendingExams += t.pendingExams.length;
        } else {
          const st = String(t.status || t.estado || '').toLowerCase();
          if (st === 'pendiente' || st === 'en_proceso') {
            pendingExams += 1;
          }
        }
      });
    }
  } catch (err) {
    console.warn('[dashboard-service] Error fetching summary metrics from Firestore:', err);
    if (cachedData) {
      return { ...cachedData, fromCache: false };
    }
  }

  const summary: DashboardSummary = {
    pendingAppointments,
    pendingPatients,
    pendingExams,
    fromCache: false,
  };

  try {
    await AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(summary));
  } catch (err) {
    // ignore cache write error
  }

  return summary;
}

/**
 * Fetches quick access items permitted for the user's role, taking saved customization into account.
 */
export async function fetchQuickAccessItems(user?: UserProfile | null): Promise<QuickAccessItem[]> {
  const userRole = user?.rol || USER_ROLES.ODONTOLOGO;

  // Items allowed for this role
  const allowed = ALL_QUICK_ACCESS_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  try {
    const rawSaved = await AsyncStorage.getItem(`${QUICK_ACCESS_KEY}_${userRole}`);
    if (rawSaved) {
      const savedIds: string[] = JSON.parse(rawSaved);
      const customItems = savedIds
        .map((id) => allowed.find((item) => item.id === id))
        .filter((item): item is QuickAccessItem => Boolean(item));

      if (customItems.length > 0) {
        return customItems;
      }
    }
  } catch (err) {
    // fallback to defaults
  }

  // Default selection based on role (top 3 or 4)
  if (userRole === USER_ROLES.USUARIO_EXTERNO) {
    return allowed.slice(0, 2);
  }
  return allowed.slice(0, 3);
}

/**
 * Saves customized quick access items for the user role.
 */
export async function saveQuickAccessPreferences(userRole: string, itemIds: string[]): Promise<void> {
  await AsyncStorage.setItem(`${QUICK_ACCESS_KEY}_${userRole}`, JSON.stringify(itemIds));
}

/**
 * Fetches user notifications.
 */
export async function fetchNotifications(user?: UserProfile | null): Promise<NotificationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_NOTIFICATIONS;
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<NotificationItem[]> {
  const current = await fetchNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
  return updated;
}

/**
 * Performs a debounced global search filtered strictly by role permissions.
 */
export async function performGlobalSearch(
  query: string,
  user?: UserProfile | null
): Promise<SearchResultItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const role = user?.rol || USER_ROLES.ODONTOLOGO;
  const results: SearchResultItem[] = [];

  // 1. Modules (accessible by current role)
  ALL_QUICK_ACCESS_ITEMS.forEach((item) => {
    if (item.allowedRoles.includes(role)) {
      if (item.id.toLowerCase().includes(trimmed) || item.labelKey.toLowerCase().includes(trimmed)) {
        results.push({
          id: `mod-${item.id}`,
          title: item.labelKey,
          subtitle: 'Módulo del sistema',
          category: 'modules',
          route: item.route,
        });
      }
    }
  });

  // 2. Patients (only if permitted)
  if (canAccessClinicalData(role)) {
    const mockPatients = [
      { id: 'pat-1', name: 'Ana Gómez', doc: '12345678A' },
      { id: 'pat-2', name: 'Carlos Pérez', doc: '87654321B' },
      { id: 'pat-3', name: 'María Rodríguez', doc: '11223344C' },
      { id: 'pat-4', name: 'Juan Ramirez', doc: '55667788D' },
    ];

    mockPatients.forEach((p) => {
      if (p.name.toLowerCase().includes(trimmed) || p.doc.toLowerCase().includes(trimmed)) {
        results.push({
          id: `patient-${p.id}`,
          title: p.name,
          subtitle: `Documento: ${p.doc}`,
          category: 'patients',
          route: `/(tabs)/patient-file?patientId=${p.id}`,
        });
      }
    });
  }

  // 3. Appointments (only if permitted) - from Firestore database
  if (canAccessClinicalData(role)) {
    try {
      const snap = await firestore().collection('citas').get();
      if (snap && !snap.empty) {
        snap.docs.forEach((doc) => {
          const a = doc.data() || {};
          const patient = String(a.patientName || '');
          const reason = String(a.reason || a.treatmentName || '');
          const time = String(a.time ? `${a.time} ${a.period || ''}`.trim() : '');
          if (
            patient.toLowerCase().includes(trimmed) ||
            reason.toLowerCase().includes(trimmed)
          ) {
            results.push({
              id: `apt-${doc.id}`,
              title: `${patient} - ${reason}`.trim().replace(/^-\s*|\s*-\s*$/g, ''),
              subtitle: time ? `Hora: ${time}` : 'Cita agendada',
              category: 'appointments',
              route: '/(tabs)/agenda',
            });
          }
        });
      }
    } catch {
      // ignore
    }
  }

  // 4. Treatments & Exams (only if permitted)
  if (canAccessTreatments(role)) {
    const mockTreatments = [
      { id: 'trt-1', name: 'Ortodoncia Correctiva', category: 'Ortodoncia' },
      { id: 'trt-2', name: 'Endodoncia Molar', category: 'Endodoncia' },
      { id: 'trt-3', name: 'Examen Panorámico', category: 'Radiología' },
    ];

    mockTreatments.forEach((t) => {
      if (
        t.name.toLowerCase().includes(trimmed) ||
        t.category.toLowerCase().includes(trimmed)
      ) {
        results.push({
          id: `trt-${t.id}`,
          title: t.name,
          subtitle: `Categoría: ${t.category}`,
          category: 'treatments',
          route: '/(tabs)/patients/register-treatment',
        });
      }
    });
  }

  return results;
}
