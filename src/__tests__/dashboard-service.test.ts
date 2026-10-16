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
    const firestore = require('@react-native-firebase/firestore');
    firestore().collection.mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    }));
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
    it('calculates metrics dynamically from Firestore collections when online', async () => {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const firestore = require('@react-native-firebase/firestore');
      firestore().collection.mockImplementation((name: string) => {
        if (name === 'citas') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                { id: 'c1', data: () => ({ status: 'EN ESPERA', date: todayKey, patientId: 'p1' }) },
                { id: 'c2', data: () => ({ status: 'programada', date: todayKey, patientId: 'p2' }) },
                { id: 'c3', data: () => ({ status: 'CANCELADO', date: todayKey, patientId: 'p3' }) },
                { id: 'c4', data: () => ({ status: 'EN ESPERA', date: '2020-01-01', patientId: 'p4' }) },
              ],
            }),
          };
        }
        if (name === 'pacientes') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                { id: 'p1', data: () => ({ status: 'pendiente' }) },
                { id: 'p2', data: () => ({ estado: 'pendiente' }) },
                { id: 'p3', data: () => ({}) },
                { id: 'p4', data: () => ({ status: 'activo', lastVisit: '2026-01-01' }) },
              ],
            }),
          };
        }
        if (name === 'tratamientos') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                { id: 't1', data: () => ({ pendingExams: [{ id: 'e1' }, { id: 'e2' }] }) },
                { id: 't2', data: () => ({ status: 'pendiente' }) },
                { id: 't3', data: () => ({ status: 'completado' }) },
              ],
            }),
          };
        }
        return firestore();
      });

      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(2);
      expect(summary.pendingPatients).toBe(3);
      expect(summary.pendingExams).toBe(3);
      expect(summary.fromCache).toBe(false);
    });

    it('returns 0 metrics and stores them in cache when online and Firestore is empty', async () => {
      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(0);
      expect(summary.pendingPatients).toBe(0);
      expect(summary.pendingExams).toBe(0);
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

    it('returns default summary when offline and cache is empty', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(0);
      expect(summary.fromCache).toBe(true);
    });

    it('recovers gracefully when NetInfo.fetch throws', async () => {
      (NetInfo.fetch as jest.Mock).mockRejectedValueOnce(new Error('NetInfo error'));
      const summary = await fetchDashboardSummary({ uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(summary.pendingAppointments).toBe(0);
      expect(summary.fromCache).toBe(false);
    });
  });

  describe('fetchQuickAccessItems edge cases', () => {
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

    it('falls back to default items when saved items contain no valid matches', async () => {
      await AsyncStorage.setItem(`ati_quick_access_v1_${USER_ROLES.ODONTOLOGO}`, JSON.stringify(['non-existent-1', 'non-existent-2']));
      const items = await fetchQuickAccessItems({ uid: 'dent', email: 'dent@test.com', rol: USER_ROLES.ODONTOLOGO });
      expect(items.length).toBe(3);
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

    it('finds patients by document number and appointments by reason', async () => {
      const firestore = require('@react-native-firebase/firestore');
      firestore().collection.mockImplementation((name: string) => {
        if (name === 'citas') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                {
                  id: 'apt-1',
                  data: () => ({ patientName: 'Ana Gómez', reason: 'Limpieza dental', time: '09:00 AM' }),
                },
              ],
            }),
          };
        }
        return firestore();
      });

      const res = await performGlobalSearch('12345678A', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(res.some((r) => r.category === 'patients' && r.id === 'patient-pat-1')).toBe(true);

      const aptRes = await performGlobalSearch('Limpieza', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(aptRes.some((r) => r.category === 'appointments')).toBe(true);
    });

    it('finds treatments matching by category name', async () => {
      const res = await performGlobalSearch('Radiología', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(res.some((r) => r.category === 'treatments' && r.title === 'Examen Panorámico')).toBe(true);
    });

    it('finds patients and appointments for clinical roles', async () => {
      const firestore = require('@react-native-firebase/firestore');
      firestore().collection.mockImplementation((name: string) => {
        if (name === 'citas') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                {
                  id: 'apt-1',
                  data: () => ({ patientName: 'Ana Gómez', reason: 'Limpieza dental', time: '09:00 AM' }),
                },
              ],
            }),
          };
        }
        return firestore();
      });

      const res = await performGlobalSearch('Ana', { uid: '1', email: 'a@b.com', rol: USER_ROLES.ODONTOLOGO });
      expect(res.some((r) => r.category === 'patients')).toBe(true);
      expect(res.some((r) => r.category === 'appointments')).toBe(true);
    });

    it('does NOT return patients, appointments or treatments for external user', async () => {
      const firestore = require('@react-native-firebase/firestore');
      firestore().collection.mockImplementation((name: string) => {
        if (name === 'citas') {
          return {
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [
                {
                  id: 'apt-1',
                  data: () => ({ patientName: 'Ana Gómez', reason: 'Limpieza dental', time: '09:00 AM' }),
                },
              ],
            }),
          };
        }
        return firestore();
      });

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
