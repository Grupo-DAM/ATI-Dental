import { useState, useEffect, useMemo } from 'react';
import { firestore } from '@/config/firebase';
import { RetentionDataPoint } from '../types';
import { parseRetentionData, formatRetentionPercentage } from '../utils/reports-utils';
import { isAdminUser } from '@/constants/user-roles';
import { fetchRetentionMetrics } from '@/services/retention-service';

interface UseRetentionMetricsProps {
  user: any;
  authLoading: boolean;
  enabled?: boolean;
  t: (k: string) => string;
}

export function useRetentionMetrics({
  user,
  authLoading,
  enabled = true,
  t,
}: UseRetentionMetricsProps) {
  const [retentionData, setRetentionData] = useState<RetentionDataPoint[]>([]);
  const [totalCohortUsers, setTotalCohortUsers] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    if (!enabled) return;

    let isMounted = true;
    setLoading(true);
    setQueryError(null);

    // 1. Alternativa 2 (Spike #100): Consultar endpoint serverless del Worker
    fetchRetentionMetrics()
      .then((result) => {
        if (!isMounted) return;
        if (result.success && result.data) {
          const rawD1 = result.data.dia1 ?? result.data.day1;
          const rawD7 = result.data.dia7 ?? result.data.day7;
          const rawD30 = result.data.dia30 ?? result.data.day30;

          if (rawD1 !== undefined || rawD7 !== undefined || rawD30 !== undefined) {
            const parsed = parseRetentionData(result.data, t);
            const total =
              typeof result.data.totalUsuariosCohorte === 'number'
                ? result.data.totalUsuariosCohorte
                : Number(result.data.totalCohortUsers) || 0;

            setRetentionData((prev) => {
              const hasExisting = prev.some((p) => p.percentage > 0);
              return hasExisting ? prev : parsed;
            });
            setTotalCohortUsers((prev) => (prev > 0 ? prev : total));
            setLoading(false);
          }
        }
      })
      .catch(() => {
        // En caso de error de red o timeout, se delega al listener reactivo
      });

    try {
      const unsubscribe = firestore()
        .collection('metricas_retencion')
        .doc('actual')
        .onSnapshot(
          (docSnapshot) => {
            if (!isMounted) return;

            const exists = typeof docSnapshot?.exists === 'function'
              ? docSnapshot.exists()
              : Boolean(docSnapshot?.exists);

            if (!docSnapshot || !exists) {
              setRetentionData(parseRetentionData({}, t));
              setTotalCohortUsers(0);
              setLoading(false);
              return;
            }

            const data: any = typeof docSnapshot.data === 'function'
              ? docSnapshot.data() || {}
              : (docSnapshot.data || {});

            const parsed = parseRetentionData(data, t);
            setRetentionData(parsed);
            const total = typeof data.totalUsuariosCohorte === 'number'
              ? data.totalUsuariosCohorte
              : (Number(data.totalCohortUsers) || 0);
            setTotalCohortUsers(total);
            setLoading(false);
          },
          (err: any) => {
            console.warn('[useRetentionMetrics] Error al obtener retención:', err);
            if (isMounted) {
              const isPerm =
                err?.code === 'firestore/permission-denied' ||
                String(err?.message || err).includes('permission-denied');
              setQueryError(
                isPerm
                  ? (t('reports.retentionPermissionError') || t('reports.permissionError'))
                  : (t('reports.retentionErrorLoad') || t('reports.errorLoad'))
              );
              setLoading(false);
            }
          }
        );

      return () => {
        isMounted = false;
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (e) {
      console.error(e);
      if (isMounted) setLoading(false);
    }
  }, [enabled, user?.uid, user?.rol, authLoading, t]);

  const day1Item = useMemo(() => retentionData.find((d) => d.label === 'D1'), [retentionData]);
  const day7Item = useMemo(() => retentionData.find((d) => d.label === 'D7'), [retentionData]);
  const day30Item = useMemo(() => retentionData.find((d) => d.label === 'D30'), [retentionData]);

  const day1String = useMemo(() => formatRetentionPercentage(day1Item?.percentage ?? 0), [day1Item]);
  const day7String = useMemo(() => formatRetentionPercentage(day7Item?.percentage ?? 0), [day7Item]);
  const day30String = useMemo(() => formatRetentionPercentage(day30Item?.percentage ?? 0), [day30Item]);

  return {
    retentionData,
    day1String,
    day7String,
    day30String,
    day1: day1Item?.percentage ?? 0,
    day7: day7Item?.percentage ?? 0,
    day30: day30Item?.percentage ?? 0,
    totalCohortUsers,
    loading,
    queryError,
  };
}
