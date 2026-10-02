import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  fetchDashboardSummary,
  fetchQuickAccessItems,
  saveQuickAccessPreferences,
  fetchNotifications,
  markNotificationAsRead,
  performGlobalSearch,
  canAccessClinicalData,
  canAccessTreatments,
  ALL_QUICK_ACCESS_ITEMS,
} from '@/services/dashboard-service';
import { USER_ROLES } from '@/constants/user-roles';

describe('dashboard-service', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe('canAccessClinicalData & canAccessTreatments', () => {
    it('allows clinical access for dentist, assistant, admin, doctor, but not external user', () => {
      expect(canAccessClinicalData(USER_ROLES.ODONTOLOGO)).toBe(true);
      expect(canAccessClinicalData(USER_ROLES.ASISTENTE)).toBe(true);
      expect(canAccessClinicalData(USER_ROLES.ADMIN)).toBe(true);
      expect(canAccessClinicalData(USER_ROLES.USUARIO_EXTERNO)).toBe(false);
      expect(canAccessClinicalData(null)).toBe(false);
    });

    it('allows treatment access only for dentist and admin', () => {
      expect(canAccessTreatments(USER_ROLES.ODONTOLOGO)).toBe(true);
      expect(canAccessTreatments(USER_ROLES.ADMIN)).toBe(true);
      expect(canAccessTreatments(USER_ROLES.ASISTENTE)).toBe(false);
      expect(canAccessTreatments(USER_ROLES.USUARIO_EXTERNO)).toBe(false);
    });
  });

  describe('fetchDashboardSummary', () => {
    it('returns default metrics and stores them in cache when online', async () => {
      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(2);
      expect(summary.pendingPatients).toBe(3);
      expect(summary.pendingExams).toBe(4);
      expect(summary.fromCache).toBe(false);
    });

    it('throws error when shouldFail is true', async () => {
      await expect(
        fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO }, { shouldFail: true })
      ).rejects.toThrow('Network error loading dashboard summary');
    });

    it('returns cached data when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
      await AsyncStorage.setItem(
        'dashboard_summary_cache_v1',
        JSON.stringify({ pendingAppointments: 10, pendingPatients: 5, pendingExams: 8 })
      );

      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(10);
      expect(summary.fromCache).toBe(true);
    });
  });

  describe('fetchQuickAccessItems & saveQuickAccessPreferences', () => {
    it('filters quick access items for external user to only contact and profile', async () => {
      const items = await fetchQuickAccessItems({ uid: 'ext', email: 'ext@test.com', rol: USER_ROLES.USUARIO_EXTERNO });
      expect(items.length).toBe(2);
      expect(items.map((i) => i.id)).toEqual(['contact', 'profile']);
    });

    it('filters quick access items for dentist by default', async () => {
      const items = await fetchQuickAccessItems({ uid: 'dent', email: 'dent@test.com', rol: USER_ROLES.ODONTOLOGO });
      expect(items.length).toBe(3);
      expect(items.map((i) => i.id)).toEqual(['agenda', 'patients', 'treatments']);
    });

    it('loads customized preferences if previously saved', async () => {
      await saveQuickAccessPreferences(USER_ROLES.ODONTOLOGO, ['treatments', 'registerPatient', 'contact']);
      const items = await fetchQuickAccessItems({ uid: 'dent', email: 'dent@test.com', rol: USER_ROLES.ODONTOLOGO });
      expect(items.map((i) => i.id)).toEqual(['treatments', 'registerPatient', 'contact']);
    });
  });

  describe('notifications', () => {
    it('fetches notifications with unread status', async () => {
      const notifs = await fetchNotifications();
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs[0].read).toBe(false);
    });

    it('marks notification as read and updates storage', async () => {
      const updated = await markNotificationAsRead('notif-1');
      const found = updated.find((n) => n.id === 'notif-1');
      expect(found?.read).toBe(true);
    });
  });

  describe('performGlobalSearch', () => {
    it('returns empty array when query is empty', async () => {
      const res = await performGlobalSearch('   ', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(res).toEqual([]);
    });

    it('finds patients and appointments for clinical roles', async () => {
      const res = await performGlobalSearch('Ana', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(res.some((r) => r.category === 'patients')).toBe(true);
      expect(res.some((r) => r.category === 'appointments')).toBe(true);
    });

    it('does NOT return patients, appointments or treatments for external user', async () => {
      const res = await performGlobalSearch('Ana', { uid: '1', email: 'a@b.com', rol: USER_ROLES.USUARIO_EXTERNO });
      expect(res.some((r) => r.category === 'patients')).toBe(false);
      expect(res.some((r) => r.category === 'appointments')).toBe(false);
      expect(res.some((r) => r.category === 'treatments')).toBe(false);
    });

    it('finds accessible modules by keyword', async () => {
      const res = await performGlobalSearch('contact', { uid: '1', email: 'a@b.com', rol: USER_ROLES.USUARIO_EXTERNO });
      expect(res.some((r) => r.category === 'modules' && r.id === 'mod-contact')).toBe(true);
    });
  });
});
