import { useEffect, useMemo, useState } from 'react';
import { firestore } from '@/config/firebase';
import { isAdminUser } from '@/constants/user-roles';
import type { UserProfile } from '@/hooks/use-auth';
import { UserDemographicsRecord } from '../types';
import { aggregateUserDemographics } from '../utils/reports-utils';

interface UseUserDemographicsProps {
  user: UserProfile | null;
  authLoading: boolean;
  enabled: boolean;
  t: (key: string) => string;
}

export function useUserDemographics({
  user,
  authLoading,
  enabled,
  t,
}: Readonly<UseUserDemographicsProps>) {
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserDemographicsRecord[]>([]);

  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user) || !enabled) return;

    let isMounted = true;
    setLoading(true);
    setQueryError(null);

    try {
      const unsubscribe = firestore()
        .collection('usuarios')
        .onSnapshot(
          (snap) => {
            if (!isMounted) return;
            const docs = snap?.docs ?? [];
            setUsers(
              docs.map((doc) => ({
                id: doc.id,
                ...(typeof doc.data === 'function' ? doc.data() : {}),
              })),
            );
            setLoading(false);
          },
          (err: { code?: string; message?: string }) => {
            if (!isMounted) return;
            const errStr = err?.message ?? (typeof err === 'string' ? err : JSON.stringify(err));
            const isPerm =
              err?.code === 'firestore/permission-denied' ||
              errStr.includes('permission-denied');
            setQueryError(isPerm ? t('reports.permissionError') : t('reports.errorLoad'));
            setLoading(false);
          },
        );

      return () => {
        isMounted = false;
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch {
      setQueryError(t('reports.errorLoad'));
      setLoading(false);
    }
  }, [authLoading, enabled, user?.uid, user?.rol]);

  const metrics = useMemo(() => aggregateUserDemographics(users), [users]);

  return { ...metrics, loading, queryError };
}
