//Listener Firestore de sesiones y usuarios
import { useState, useEffect, useMemo } from 'react';
import { firestore } from '@/config/firebase';
import { SessionRecord, PeriodOption } from '../types';
import { getRecordTimestamp } from '../utils/reports-utils';
import { isAdminUser } from '@/constants/user-roles';

export function useAdminSessions(user: any, authLoading: boolean, period: PeriodOption, t: (k: string) => string) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [systemActiveUsersCount, setSystemActiveUsersCount] = useState<number | null>(null);
  // Escuchar usuarios
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    try {
      const unsubscribe = firestore().collection('usuarios').onSnapshot((snap) => {
        if (!snap?.docs) return;
        const activeDocs = snap.docs.filter((doc) => {
          const data = doc.data() || {};
          return data.estado === 'activo' || (!data.estado && data.estado !== 'inactivo');
        });
        setSystemActiveUsersCount(activeDocs.length > 0 ? activeDocs.length : snap.docs.length);
      });
      return () => unsubscribe?.();
    } catch (e) {}
  }, [user?.uid, user?.rol, authLoading]);
  // Escuchar sesiones por período
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    setLoading(true);
    setQueryError(null);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period - 1));
    startDate.setHours(0, 0, 0, 0);
    const unsubscribe = firestore()
      .collection('sesiones')
      .where('fecha', '>=', startDate)
      .onSnapshot(
        (snap) => {
          setSessions(snap?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? []);
          setLoading(false);
        },
        (err: any) => {
          const isPerm = err?.code === 'firestore/permission-denied' || String(err?.message || err).includes('permission-denied');
          setQueryError(isPerm ? t('reports.permissionError') : t('reports.errorLoad'));
          setLoading(false);
        }
      );
    return () => unsubscribe?.();
  }, [period, user?.uid, user?.rol, authLoading]);
  // Métricas derivadas
  const { totalAccessToday, activeUsersCount } = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 86400000;
    let todayCount = 0;
    const unique = new Set<string>();
    sessions.forEach((s) => {
      const ts = getRecordTimestamp(s);
      const uid =
        s.userId ||
        s.usuarioId ||
        s.uid ||
        (s as any).user ||
        (s as any).usuario ||
        (s as any).email ||
        s.id;

      if (uid) unique.add(uid);
      if (ts !== null && ts >= todayStart && ts < todayEnd) todayCount++;
    });
    return { totalAccessToday: todayCount, activeUsersCount: unique.size };
  }, [sessions]);
  const displayedActiveUsers = (systemActiveUsersCount !== null && systemActiveUsersCount > 0)
    ? systemActiveUsersCount
    : activeUsersCount;
  return { sessions, loading, queryError, totalAccessToday, activeUsersCount, displayedActiveUsers };
}