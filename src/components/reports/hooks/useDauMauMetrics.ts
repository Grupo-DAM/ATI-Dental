//Listener Firestore de métricas DAU / MAU
import { useState, useEffect } from 'react';
import { firestore } from '@/config/firebase';
import { DauMauDataPoint } from '@/components/reports/dau-mau-line-chart';
import { calculateDauMauRatio } from '../utils/reports-utils';
import { isAdminUser } from '@/constants/user-roles';

interface UseDauMauMetricsProps {
  user: any;
  authLoading: boolean;
  enabled: boolean;
  systemActiveUsersCount: number | null;
  activeUsersCount: number;
}

export function useDauMauMetrics({
  user,
  authLoading,
  enabled,
  systemActiveUsersCount,
  activeUsersCount,
}: UseDauMauMetricsProps) {
  // [Líneas 78-88 de reports.tsx]
  const [dauValue, setDauValue] = useState<number>(0);
  const [mauValue, setMauValue] = useState<number>(0);
  const [dauMauRatio, setDauMauRatio] = useState<number>(0);
  const [dauMauData, setDauMauData] = useState<DauMauDataPoint[]>([
    { label: 'Abr', mau: 0, dau: 0 },
    { label: 'May', mau: 0, dau: 0 },
    { label: 'Jun', mau: 0, dau: 0 },
    { label: 'Jul', mau: 0, dau: 0 },
    { label: 'Ago', mau: 0, dau: 0 },
    { label: 'Sep', mau: 0, dau: 0 },
  ]);

  // [Líneas 210-275 de reports.tsx]
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    if (!enabled) return;

    let isMounted = true;

    const loadFallback = () => {
      if (!isMounted) return;
      const realMau = systemActiveUsersCount ?? 0;
      const realDau = activeUsersCount ?? 0;
      setDauValue(realDau);
      setMauValue(realMau);
      setDauMauRatio(calculateDauMauRatio(realDau, realMau));

      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const today = new Date();
      const autoMonths: DauMauDataPoint[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const isCurrent = i === 0;
        autoMonths.push({
          label: monthNames[d.getMonth()],
          mau: isCurrent ? realMau : Math.max(Math.round(realMau * (1 - i * 0.15)), 0),
          dau: isCurrent ? realDau : Math.max(Math.round(realDau * (1 - i * 0.15)), 0),
        });
      }
      setDauMauData(autoMonths);
    };

    try {
      const unsubscribe = firestore()
        .collection('metricas_accesos')
        .doc('actual')
        .onSnapshot(
          (docSnapshot) => {
            if (!isMounted) return;
            const hasDoc = docSnapshot && typeof docSnapshot.data === 'function';
            const data = hasDoc ? docSnapshot.data() : null;

            if (data && ((data.dau && data.dau > 0) || (data.mau && data.mau > 0))) {
              const d = typeof data.dau === 'number' ? data.dau : 0;
              const m = typeof data.mau === 'number' ? data.mau : 0;
              setDauValue(d);
              setMauValue(m);
              setDauMauRatio(calculateDauMauRatio(d, m));
              if (Array.isArray(data.historico) && data.historico.length > 0) {
                setDauMauData(data.historico);
              }
            } else {
              loadFallback();
            }
          },
          (_err) => {
            loadFallback();
          }
        );

      return () => {
        isMounted = false;
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    } catch (e) {
      loadFallback();
    }
  }, [enabled, user?.uid, user?.rol, authLoading, systemActiveUsersCount, activeUsersCount]);

  return { dauValue, mauValue, dauMauRatio, dauMauData };
}