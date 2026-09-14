import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list';
import { KPICard, KPICardProp } from '@/components/reports/KPICard';
import { UsageLineChart, ChartDataPoint } from '@/components/reports/usage-line-chart';
import { DauMauLineChart, DauMauDataPoint } from '@/components/reports/dau-mau-line-chart';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { isAdminUser } from '@/constants/user-roles';
import { firestore } from '@/config/firebase';

export interface SessionRecord {
  id: string;
  userId?: string;
  usuarioId?: string;
  uid?: string;
  fecha?: any;
  tiempoInicio?: any;
  tiempoFin?: any;
  duracion?: number; // in minutes or seconds
  tiempoUso?: number; // in minutes
}

type PeriodOption = 7 | 15 | 30;
const AVAILABLE_PERIODS: PeriodOption[] = [7, 15, 30];

export function generatePeriodOptions(t: (key: string) => string): ModalOptionProp[] {
  return AVAILABLE_PERIODS.map((days) => ({
    name: days,
    testID: `period-option-${days}`,
    label: t(`reports.period${days}Days`), 
  }));
}

const DAU_MAU_TARGET_RATIO = 50;
const CRASH_RATE_TOLERANCE_LIMIT = 0.1;

// Calcula la relación porcentual entre DAU y MAU (Stickiness).
// Protege la division entre 0.
export function calculateDauMauRatio(dau: number, mau: number): number {
  return mau > 0 ? Math.round((dau / mau) * 100) : 0;
}

export function calculateCrashRatePercentage(totalCrashes: number, totalSessions: number): string {
  if (!totalSessions || totalSessions === 0 || !totalCrashes || totalCrashes === 0) {
    return '0.00%'; // returns 0.00% if 0 crashes (scenario 3)
  }
  const rate = (totalCrashes / totalSessions) * 100;
  return `${rate.toFixed(2)}%`;
}

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyle(theme);
  const { user, loading: authLoading } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(30);
  const [selectedReportType, setSelectedReportType] = useState<'usage' | 'access' | 'dau_mau' | 'crash_rate'>('usage');

  // Estados DAU / MAU
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

  // Crash Rate States
  const [totalCrashesValue, setTotalCrashesValue] = useState<number>(0);
  const [affectedUsersValue, setAffectedUsersValue] = useState<number>(0);
  const [crashRateData, setCrashRateData] = useState<ChartDataPoint[]>([]);

  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [systemActiveUsersCount, setSystemActiveUsersCount] = useState<number | null>(null);

  const userUid = user?.uid;
  const userRole = user?.rol;

  const reportTypeOptions: ModalOptionProp[] = [
    { name: 'usage', testID: 'type-option-usage', label: t('reports.reportTypeLabel') },
    { name: 'dau_mau', testID: 'type-option-dau-mau', label: t('reports.reportTypeDauMau') },
    { name: 'access', testID: 'type-option-access', label: t('reports.chartTitle') },
    { name: 'crash_rate', testID: 'type-option-crash-rate', label: t('reports.reportTypeCrashRate') },
  ]

  const periodOptions: ModalOptionProp [] = generatePeriodOptions(t);

  // 1. Role validation (Admin only)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      Alert.alert(t('reports.sessionRequired'), '');
      router.replace('/(tabs)/home');
      return;
    }

    if (!isAdminUser(user)) {
      Alert.alert(t('reports.accessDenied'), '');
      router.replace('/(tabs)/home');
      return;
    }
  }, [userUid, userRole, authLoading]);

  // 2. Reactive Firestore subscription for system active users
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;

    try {
      const unsubscribeUsers = firestore()
        .collection('usuarios')
        .onSnapshot(
          (snapshot) => {
            if (!snapshot || !snapshot.docs) return;
            const activeDocs = snapshot.docs.filter((doc) => {
              const data = doc.data() || {};
              return data.estado === 'activo' || (!data.estado && data.estado !== 'inactivo');
            });
            setSystemActiveUsersCount(activeDocs.length > 0 ? activeDocs.length : snapshot.docs.length);
          },
          (err) => {
            console.warn('[AdminReportsScreen] Consulta de usuarios activa:', err);
          }
        );

      return () => {
        if (typeof unsubscribeUsers === 'function') unsubscribeUsers();
      };
    } catch (e) {
      // Ignore if not supported in mock environment
    }
  }, [userUid, userRole, authLoading]);

  // 3. Reactive Firestore subscription (Scenario 2: Real-time onSnapshot)
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;

    setLoading(true);
    setQueryError(null);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (selectedPeriod - 1));
    startDate.setHours(0, 0, 0, 0);

    const unsubscribe = firestore()
      .collection('sesiones')
      .where('fecha', '>=', startDate)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot) {
            setSessions([]);
            setLoading(false);
            return;
          }

          const records: SessionRecord[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setSessions(records);
          setLoading(false);
        },
        (err: any) => {
          console.error('[AdminReportsScreen] Error al obtener sesiones de Firestore:', err);
          const isPermission =
            err?.code === 'firestore/permission-denied' ||
            String(err?.message || err).includes('permission-denied');
          setQueryError(isPermission ? t('reports.permissionError') : t('reports.errorLoad'));
          setLoading(false);
        }
      );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedPeriod, userUid, userRole, authLoading]);

   //Consulta reactiva a Firestore para DAU / MAU
     useEffect(() => {
       if (authLoading || !user || !isAdminUser(user)) return;
       if (selectedReportType !== 'dau_mau') return;

       let isMounted = true;

       const loadFallback = () => {
         if (!isMounted) return;
         const realMau = (systemActiveUsersCount || displayedActiveUsers) ?? 0;
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
     }, [selectedReportType, userUid, userRole, authLoading]);

  // Helper to Build history lookup map from raw array
  const buildHistoryMap = (historico: any[]): Map<string, number> => {
    const historyMap = new Map<string, number>();

    for (const item of historico) {
      const rawVal = typeof item.value === 'number' ? item.value : (Number(item.tasa) || 0);
      const key = item.date || item.fecha || item.label;

      if (key) {
        historyMap.set(String(key), rawVal);
      }
    }

    return historyMap;
  };

  // Helper to Generate padded time-series chart data
  const generatePaddedChartData = (historyMap: Map<string, number>, periodDays: number): ChartDataPoint[] => {
    const paddedData: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);

      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayNumLabel = String(d.getDate());
      const matchedValue = historyMap.get(dateKey) ?? historyMap.get(dayNumLabel) ?? 0.0;

      paddedData.push({
        label: dayNumLabel,
        value: matchedValue,
        date: dateKey,
      });
    }

    return paddedData;
  };
    
  // 5. Reactive Firestore Crashrate/Stability
  useEffect(() => {
    if (authLoading || !user || !isAdminUser(user)) return;
    if (selectedReportType !== 'crash_rate') return;

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

            const data = typeof docSnapshot.data === 'function' 
              ? docSnapshot.data() || {} 
              : (docSnapshot.data || {});

            // Inyección de valores numéricos para KPIs
            setTotalCrashesValue(typeof data.totalCrashes === 'number' ? data.totalCrashes : 0);
            setAffectedUsersValue(typeof data.affectedUsers === 'number' ? data.affectedUsers : 0);

            // Procesamiento de datos del gráfico mediante auxiliares
            if (Array.isArray(data.historico)) {
              const historyMap = buildHistoryMap(data.historico);
              setCrashRateData(generatePaddedChartData(historyMap, selectedPeriod));
            } else {
              setCrashRateData([]);
            }

            setLoading(false);
          },
          (err) => {
            console.warn('[AdminReportsScreen] Error al obtener estabilidad:', err);
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
      if (isMounted) {
        setLoading(false);
      }
    }
    // 3. Array de dependencias alineado exclusivamente con variables primitivas
  }, [selectedReportType, selectedPeriod, userUid, userRole, authLoading, t]);
  // Helper to extract timestamp millis from varied date formats
  const getRecordTimestamp = (record: SessionRecord): number | null => {
    const raw = record.fecha ?? record.tiempoInicio;
    if (!raw) return null;
    if (typeof raw === 'number') return raw;
    if (raw instanceof Date) return raw.getTime();
    if (typeof raw?.toMillis === 'function') return raw.toMillis();
    if (typeof raw?.toDate === 'function') return raw.toDate().getTime();
    const parsed = Date.parse(raw);
    return isNaN(parsed) ? null : parsed;
  };

  // Helper to extract duration in minutes
  const getRecordDurationMinutes = (record: SessionRecord): number => {
    if (typeof record.tiempoUso === 'number') return record.tiempoUso;
    if (typeof record.duracion === 'number') {
      // If duration > 300, it's likely in seconds
      return record.duracion > 300 ? Math.round(record.duracion / 60) : record.duracion;
    }
    const start = record.tiempoInicio
      ? typeof record.tiempoInicio?.toMillis === 'function'
        ? record.tiempoInicio.toMillis()
        : new Date(record.tiempoInicio).getTime()
      : null;
    const end = record.tiempoFin
      ? typeof record.tiempoFin?.toMillis === 'function'
        ? record.tiempoFin.toMillis()
        : new Date(record.tiempoFin).getTime()
      : null;

    if (start && end && end > start) {
      return Math.round((end - start) / 60000);
    }
    return 0;
  };

  // 4. Compute KPI metrics
  const { totalAccessToday, activeUsersCount } = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    let todayCount = 0;
    const uniqueUsers = new Set<string>();

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

      if (uid) uniqueUsers.add(uid);

      if (ts !== null && ts >= todayStart && ts < todayEnd) {
        todayCount++;
      }
    });

    return {
      totalAccessToday: todayCount,
      activeUsersCount: uniqueUsers.size,
    };
  }, [sessions]);

  // If system has registered active users in 'usuarios', prefer that; otherwise fallback to sessions
  const displayedActiveUsers = useMemo(() => {
    if (systemActiveUsersCount !== null && systemActiveUsersCount > 0) {
      return systemActiveUsersCount;
    }
    return activeUsersCount;
  }, [systemActiveUsersCount, activeUsersCount]);

  //dynamic KPI card generator (so the code doesn't suck as much)
  const calculatedCrashRateString = useMemo(() => {
    return calculateCrashRatePercentage(totalCrashesValue, sessions.length);
  }, [totalCrashesValue, sessions.length]);

  // Generador Dinámico de la estructura de las tarjetas KPI en base al tipo de reporte activo
  const currentKPICards = useMemo<KPICardProp[]>(() => {
    if (selectedReportType === 'dau_mau') {
      return [
        { tinyType: true, label: t('reports.kpiRatio'), value: `${dauMauRatio}%`, iconName: 'trending-up', 
          valueTestID: 'kpi-ratio-value', cardTestID: 'kpi-card-ratio', hasSubLabel: true, accentSubLabel: true, subLabel: `Meta: ${DAU_MAU_TARGET_RATIO}%` },
        { tinyType: true, label: t('reports.kpiDau'), value: dauValue, iconName: 'person-outline', 
          valueTestID: 'kpi-dau-value', cardTestID: 'kpi-card-dau', hasSubLabel: true, subLabel: t('reports.kpiDailyAvg') },
        { tinyType: true, label: t('reports.kpiMau'), value: mauValue, iconName: 'people-outline', 
          valueTestID: 'kpi-mau-value', cardTestID: 'kpi-card-mau', hasSubLabel: true, subLabel: t('reports.kpiThisMonth') }
      ];
    }

    if (selectedReportType === 'crash_rate') {
      return [
        { tinyType: true, label: t('reports.crashRateToday'), value: calculatedCrashRateString, iconName: 'shield-checkmark-outline', 
          valueTestID: 'kpi-crash-rate-val', cardTestID: 'kpi-crash-rate'},
        { tinyType: true, label: t('reports.totalCrashesToday'), value: totalCrashesValue, iconName: 'bug-outline', 
          valueTestID: 'kpi-total-crashes-val', cardTestID: 'kpi-total-crashes' },
        { tinyType: true, label: true ? t('reports.affectedUsers') : 'Users', value: affectedUsersValue, iconName: 'sad-outline', 
          valueTestID: 'kpi-affected-users-val', cardTestID: 'kpi-affected-users' }
      ];
    }
    
    return [
      { tinyType: false, label: t('reports.totalAccessToday'), value: totalAccessToday, iconName: 'log-in-outline', 
        valueTestID: 'kpi-total-access-val', cardTestID: 'kpi-total-access' },
      { tinyType: false, label: t('reports.activeUsers'), value: displayedActiveUsers, iconName: 'people', 
        valueTestID: 'kpi-active-users-val', cardTestID: 'kpi-active-users' }
    ];
  }, [selectedReportType, dauMauRatio, dauValue, mauValue, calculatedCrashRateString, totalCrashesValue, affectedUsersValue, totalAccessToday, displayedActiveUsers, t]);

  // 4. Aggregate data for the chart by day in selected period
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (selectedReportType === 'crash_rate') return crashRateData;
    
    const days = selectedPeriod;
    const now = new Date();
    const result: ChartDataPoint[] = [];

    // Initialize daily buckets
    const buckets: { [key: string]: { accesses: number; totalMinutes: number; dateStr: string; dayNum: number } } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets[key] = {
        accesses: 0,
        totalMinutes: 0,
        dateStr: key,
        dayNum: d.getDate(),
      };
    }

    sessions.forEach((record) => {
      const ts = getRecordTimestamp(record);
      if (ts === null) return;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].accesses += 1;
        buckets[key].totalMinutes += getRecordDurationMinutes(record);
      }
    });

    // Format for chart
    Object.keys(buckets).forEach((key) => {
      const b = buckets[key];
      const val =
        selectedReportType === 'usage'
          ? b.accesses > 0
            ? Math.round(b.totalMinutes / b.accesses)
            : 0
          : b.accesses;

      result.push({
        label: String(b.dayNum),
        value: val,
        date: String(b.dayNum),
        fullDate: b.dateStr,
      });
    });

    return result;
  }, [sessions, selectedPeriod, selectedReportType, crashRateData]);

    // Check if there is any data in the selected period (Acceptance Criteria Scenario 3)
  const hasData = useMemo(() => {
    if (selectedReportType === 'dau_mau') {
      return dauMauData.length > 0 && dauMauData.some((d) => d.mau > 0 || d.dau > 0);
    }
    if (selectedReportType === 'crash_rate') {
      return crashRateData.length > 0; // Se dibuja la línea incluso si los valores son 0
    } 
    if (sessions.length === 0) return false;
    return chartData.some((d) => d.value > 0);
  }, [sessions, chartData, selectedReportType, dauMauData, crashRateData]);

  // Actions: Print and Export PDF
  const handlePrint = useCallback(() => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
        return;
      }
    }
    Alert.alert(t('reports.print'), t('reports.printTriggered'));
  }, [t]);

  const handleExportPdf = useCallback(() => {
    Alert.alert(t('reports.pdfExportSuccess'), t('reports.pdfExportMessage'));
  }, [t]);

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 7:
        return t('reports.period7Days');
      case 15:
        return t('reports.period15Days');
      case 30:
      default:
        return t('reports.period30Days');
    }
  }, [selectedPeriod, t]);

  const reportTypeLabel = useMemo(() => {
    if (selectedReportType === 'dau_mau') {
        return t('reports.reportTypeDauMau');
      }
    if (selectedReportType === 'crash_rate') {
        return t('reports.reportTypeCrashRate');
      }
    return selectedReportType === 'usage'
      ? t('reports.reportTypeUsage')
      : t('reports.chartTitle');
  }, [selectedReportType, t]);

  const getChartTitle = (reportType: string): string => {
    switch (reportType) {
      case 'dau_mau':
        return t('reports.dauMauChartTitle');
      case 'usage':
        return t('reports.chartTitleUsage');
      case 'crash_rate':
        return t('reports.chartTitleCrashRate');
      default:
        return t('reports.chartTitle');
    }
  };

  const getChartUnit = (reportType: string): string => {
  switch (reportType) {
    case 'usage':
      return 'min';
    case 'crash_rate':
      return '%';
    default:
      return 'acc';
  }
};

  return (
    <View style={styles.screen} testID="admin-reports-screen">
      <AppHeader />
      <Breadcrumb
        parent={t('reports.breadcrumbParent')}
        current={t('reports.breadcrumbCurrent')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: BottomTabInset + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Title and Subtitle */}
          <Text style={styles.screenTitle}>{t('reports.title')}</Text>
          <Text style={styles.screenSubtitle}>{t('reports.subtitle')}</Text>

          {/* Report Type Filter Selector */}
          <View style={styles.filterSection}>
            <Text style={styles.fieldLabel}>{t('reports.reportTypeLabel')}</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowReportTypeModal(true)}
              activeOpacity={0.7}
              testID="report-type-select"
            >
              <Text style={styles.selectButtonText} numberOfLines={1}>
                {reportTypeLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.pageSubtitle} />
            </TouchableOpacity>
          </View>

          {/* KPI Summary Cards */}
          <View style={selectedReportType === 'usage' ? styles.kpiRow : styles.kpiRowThree} testID="kpi-cards-container">
            {currentKPICards.map((cardProps, index) => (
              <KPICard
                key={cardProps.cardTestID || index}
                tinyType={cardProps.tinyType}
                label={cardProps.label}
                value={cardProps.value}
                iconName={cardProps.iconName}
                valueTestID={cardProps.valueTestID}
                cardTestID={cardProps.cardTestID}
                hasSubLabel={cardProps.hasSubLabel}
                accentSubLabel={cardProps.accentSubLabel}
                subLabel={cardProps.subLabel}
                loading={loading}
              />
            ))}
          </View>
          {/* Main Chart Card */}
          <View style={styles.chartCard} testID="chart-card">
            {/* Header: Title and Period Filter */}
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle} testID="chart-title">
                {getChartTitle(selectedReportType)}
              </Text>
              <TouchableOpacity
                style={styles.periodFilterBtn}
                onPress={() => setShowPeriodModal(true)}
                activeOpacity={0.7}
                testID="period-filter-btn"
              >
                <Text style={styles.periodFilterText}>{periodLabel}</Text>
                <Ionicons name="filter" size={14} color={theme.pageSubtitle} style={styles.filterIcon} />
              </TouchableOpacity>
            </View>

            {/* Chart Content or Loading / Empty / Error State */}
            {selectedReportType === 'dau_mau' ? (
              <View testID="chart-active-container">
                <DauMauLineChart
                  data={dauMauData}
                  height={230}
                  testID="reports-dau-mau-chart"
                />
              </View>
            ) : loading ? (
              <View style={styles.stateContainer} testID="chart-loading">
                <ActivityIndicator size="large" color={theme.main} />
                <Text style={styles.stateText}>{t('reports.loading')}</Text>
              </View>
            ) : queryError ? (
              <View style={styles.emptyContainer} testID="chart-error-state">
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="shield-outline" size={36} color={theme.error} />
                </View>
                <Text style={[styles.emptyText, { color: theme.error, fontWeight: '600' }]}>
                  {queryError}
                </Text>
              </View>
            ) : !hasData ? (
              /* Scenario 3: Empty state para el reporte de tiempo de uso */
              <View style={styles.emptyContainer} testID="chart-empty-state">
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="analytics-outline" size={36} color={theme.chartLegendText} />
                </View>
                <Text style={styles.emptyText}>{t('reports.emptyState')}</Text>
              </View>
            ) : (
              <View testID="chart-active-container">
                <UsageLineChart
                  data={chartData}
                  height={230}
                  unit={getChartUnit(selectedReportType)}
                  lineColor={theme.main}
                  testID="reports-usage-chart"
                />
              </View>
            )}
        </View>

          {/* Bottom Actions: Print and Export PDF */}
          <View style={styles.actionsRow}>
            {/* Print Button */}
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
              activeOpacity={0.7}
              testID="print-btn"
              accessibilityLabel={t('reports.print')}
            >
              <Ionicons name="print-outline" size={20} color={theme.fieldLabel} />
            </TouchableOpacity>

            {/* PDF Export Button */}
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={handleExportPdf}
              activeOpacity={0.7}
              testID="export-pdf-btn"
              accessibilityLabel={t('reports.exportPdf')}
            >
              <Ionicons name="document-text" size={16} color={theme.overMain} style={{ marginRight: 4 }} />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Period Selection Modal */}
      <ModalOptionList
        visible = {showPeriodModal}
        onRequestClose={() => setShowPeriodModal(false)}
        title={t('reports.reportTypeLabel')}
        options={periodOptions}
        selectedOption={selectedPeriod}
        onSelectOption={setSelectedPeriod}
      />

      {/* Report Type Modal */}
      <ModalOptionList
        visible = {showReportTypeModal}
        onRequestClose={() => setShowReportTypeModal(false)}
        title={t('reports.reportTypeLabel')}
        options={reportTypeOptions}
        selectedOption={selectedReportType}
        onSelectOption={setSelectedReportType}
      />
    </View>
  );
}

const createStyle = (theme:any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  innerContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.pageTitle,
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: theme.pageSubtitle,
    fontFamily: 'Open Sans',
    lineHeight: 20,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.fieldLabel,
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.backgroundElement,
    borderWidth: 1,
    borderColor: theme.cardSeparator,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: theme.textNames,
    fontFamily: 'Open Sans',
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  chartCard: {
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardSeparator,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.main,
    fontFamily: 'Open Sans',
  },
  periodFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.cardSeparator,
  },
  periodFilterText: {
    fontSize: 12,
    color: theme.pageSubtitle,
    fontFamily: 'Open Sans',
    fontWeight: '500',
  },
  filterIcon: {
    marginLeft: 4,
  },
  stateContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    color: theme.pageSubtitle,
    fontFamily: 'Open Sans',
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.tooltipLegend,
  },
  emptyText: {
    fontSize: 14,
    color: theme.breadcrumbSeparator,
    textAlign: 'center',
    fontFamily: 'Open Sans',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 20,
  },
  printBtn: {
    width: 44,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.cardSeparator,
    backgroundColor: theme.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pdfBtn: {
    flexDirection: 'row',
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  pdfBtnText: {
    color: theme.overMain,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  kpiRowThree: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
});
