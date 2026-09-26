import { useEffect, useState } from 'react';
import { firestore } from '@/config/firebase';
import { isAdminUser } from '@/constants/user-roles';
import type { UserProfile } from '@/hooks/use-auth';
import { UserGeographicsMetrics, CountryBucket, RegionSlice, RegionBucket } from '../types';
import { getCountryByCode } from '@/constants/countries';

interface UseUserGeographicsProps {
  user: UserProfile | null;
  authLoading: boolean;
  enabled: boolean;
  t: (key: string) => string;
}

export function useUserGeographics({
  user,
  authLoading,
  enabled,
  t,
}: Readonly<UseUserGeographicsProps>) {
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [data, setData] = useState<UserGeographicsMetrics | null>(null);

  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user) || !enabled) return;

    let isMounted = true;
    setLoading(true);
    setQueryError(null);

    try {
      const unsubscribe = firestore()
        .collection('metricas_geograficas')
        .doc('actual')
        .onSnapshot(
          (doc) => {
            if (!isMounted) return;
            const docExists = typeof doc?.exists === 'function' ? doc.exists() : Boolean(doc?.exists);
            if (!docExists) {
              setData(null);
              setLoading(false);
              return;
            }

            const rawData = typeof doc.data === 'function' ? doc.data() : doc.data;
            const countriesData = rawData?.countries || {};
            const totalUsers = rawData?.totalUsers || 0;

            // Process countries
            const countryBuckets: CountryBucket[] = Object.entries(countriesData)
              .map(([code, count]) => {
                const countryInfo = getCountryByCode(code);
                return {
                  key: code,
                  label: countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : code,
                  count: count as number,
                };
              })
              .filter((item) => item.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 8); // Top 8

            const totalCities = Object.keys(countriesData).filter(k => countriesData[k] > 0).length;
            const mainCountryBucket = countryBuckets[0];
            const mainCountry = mainCountryBucket ? mainCountryBucket.label : '';
            const mainCountryPercent = mainCountryBucket && totalUsers > 0
              ? Math.round((mainCountryBucket.count / totalUsers) * 100)
              : 0;

            // Process regions
            const regionCounts: Record<RegionBucket, number> = {
              andina: 0,
              caribe: 0,
              pacifica: 0,
              otros: 0,
            };

            Object.entries(countriesData).forEach(([code, count]) => {
              const region = getCountryByCode(code)?.region || 'otros';
              regionCounts[region] += (count as number);
            });

            const regionSlices: RegionSlice[] = Object.entries(regionCounts)
              .map(([region, count]) => {
                let label = '';
                switch (region) {
                  case 'andina': label = 'Andina'; break;
                  case 'caribe': label = 'Caribe'; break;
                  case 'pacifica': label = 'Pacífica'; break;
                  case 'otros': label = 'Otros'; break;
                }
                return {
                  key: region as RegionBucket,
                  label,
                  count,
                  percent: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
                };
              })
              .filter(item => item.count > 0)
              .sort((a, b) => b.count - a.count);

            setData({
              totalCities,
              mainCountry,
              mainCountryPercent,
              totalUsers,
              countryBuckets,
              regionSlices,
            });
            setLoading(false);
          },
          (err: { code?: string; message?: string }) => {
            if (!isMounted) return;
            const errStr = err?.message ?? (typeof err === 'string' ? err : JSON.stringify(err));
            const isPerm = err?.code === 'firestore/permission-denied' || errStr.includes('permission-denied');
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
  }, [authLoading, enabled, user?.uid, user?.rol, t]);

  return { data, loading, queryError };
}
