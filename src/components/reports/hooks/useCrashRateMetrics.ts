//Listener Firestore de métricas de estabilidad
import { useState, useEffect, useMemo } from 'react';
import { firestore } from '@/config/firebase';
import { ChartDataPoint } from '@/components/reports/usage-line-chart';
import { PeriodOption } from '../types';
import { buildHistoryMap, generatePaddedChartData, calculateCrashRatePercentage } from '../utils/reports-utils';
import { isAdminUser } from '@/constants/user-roles';

interface UseCrashRateMetricsProps {
  user: any;
  authLoading: boolean;
  enabled: boolean;
  selectedPeriod: PeriodOption;
  totalSessionsCount: number;
  t: (k: string) => string;
}

export function useCrashRateMetrics({
  user,
  authLoading,
  enabled,
  selectedPeriod,
  totalSessionsCount,
  t,
}: UseCrashRateMetricsProps) {
  // [Líneas 91-93 de reports.tsx]
  const [totalCrashesValue, setTotalCrashesValue] = useState<number>(0);
  const [affectedUsersValue, setAffectedUsersValue] = useState<number>(0);
  const [crashRateData, setCrashRateData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // [Líneas 317-381 de reports.tsx]
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    if (!enabled) return;

    let isMounted = true;
    setLoading(true);
    setQueryError(null);

    try {
      const unsubscribe = firestore()
        .collection('metricas_estabilidad')
        .doc('actual')
        .onSnapshot(
          (docSnapshot) => {
            if (!isMounted) return;

            const exists = typeof docSnapshot?.exists === 'function'
              ? docSnapshot.exists()
              : Boolean(docSnapshot?.exists);

            if (!docSnapshot || !exists) {
              setCrashRateData([]);
              setLoading(false);
              return;
            }

            const data: any = typeof docSnapshot.data === 'function'
              ? docSnapshot.data() || {}
              : (docSnapshot.data || {});

            setTotalCrashesValue(typeof data.totalCrashes === 'number' ? data.totalCrashes : 0);
            setAffectedUsersValue(typeof data.affectedUsers === 'number' ? data.affectedUsers : 0);

            if (Array.isArray(data.historico)) {
              const historyMap = buildHistoryMap(data.historico);
              setCrashRateData(generatePaddedChartData(historyMap, selectedPeriod));
            } else {
              setCrashRateData([]);
            }

            setLoading(false);
          },
          (err: any) => {
            console.warn('[useCrashRateMetrics] Error al obtener estabilidad:', err);
            if (isMounted) {
              setQueryError(t('reports.errorLoad'));
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
  }, [enabled, selectedPeriod, user?.uid, user?.rol, authLoading, t]);

  // [Líneas 460-462 de reports.tsx]
  const calculatedCrashRateString = useMemo(() => {
    return calculateCrashRatePercentage(totalCrashesValue, totalSessionsCount);
  }, [totalCrashesValue, totalSessionsCount]);

  return {
    totalCrashesValue,
    affectedUsersValue,
    crashRateData,
    calculatedCrashRateString,
    loading,
    queryError,
  };
}