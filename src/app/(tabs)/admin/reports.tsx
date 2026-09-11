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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { UsageLineChart, ChartDataPoint } from '@/components/reports/usage-line-chart';
import { Colors, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
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

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(30);
  const [selectedReportType, setSelectedReportType] = useState<'usage' | 'access'>('usage');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [systemActiveUsersCount, setSystemActiveUsersCount] = useState<number | null>(null);

  const userUid = user?.uid;
  const userRole = user?.rol;

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

  // 4. Aggregate data for the chart by day in selected period
  const chartData = useMemo<ChartDataPoint[]>(() => {
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
  }, [sessions, selectedPeriod, selectedReportType]);

  // Check if there is any data in the selected period (Acceptance Criteria Scenario 3)
  const hasData = useMemo(() => {
    if (sessions.length === 0) return false;
    return chartData.some((d) => d.value > 0);
  }, [sessions, chartData]);

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
    return selectedReportType === 'usage'
      ? t('reports.reportTypeUsage')
      : t('reports.chartTitle');
  }, [selectedReportType, t]);

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
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* KPI Summary Cards */}
          <View style={styles.kpiRow}>
            {/* Card 1: TOTAL ACCESOS (HOY) */}
            <View style={styles.kpiCard} testID="kpi-total-access">
              <View style={styles.kpiIconWrapper}>
                <Ionicons name="log-in-outline" size={24} color={Colors.light.main} />
              </View>
              <View style={styles.kpiTextWrapper}>
                <Text style={styles.kpiLabel}>{t('reports.totalAccessToday')}</Text>
                <Text style={styles.kpiValue} testID="kpi-total-access-val">
                  {loading ? '...' : totalAccessToday}
                </Text>
              </View>
            </View>

            {/* Card 2: USUARIOS ACTIVOS */}
            <View style={styles.kpiCard} testID="kpi-active-users">
              <View style={styles.kpiIconWrapper}>
                <Ionicons name="people" size={24} color={Colors.light.main} />
              </View>
              <View style={styles.kpiTextWrapper}>
                <Text style={styles.kpiLabel}>{t('reports.activeUsers')}</Text>
                <Text style={styles.kpiValue} testID="kpi-active-users-val">
                  {loading ? '...' : displayedActiveUsers}
                </Text>
              </View>
            </View>
          </View>

          {/* Main Chart Card */}
          <View style={styles.chartCard} testID="chart-card">
            {/* Header: Title and Period Filter */}
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle} testID="chart-title">
                {selectedReportType === 'usage'
                  ? t('reports.chartTitleUsage')
                  : t('reports.chartTitle')}
              </Text>
              <TouchableOpacity
                style={styles.periodFilterBtn}
                onPress={() => setShowPeriodModal(true)}
                activeOpacity={0.7}
                testID="period-filter-btn"
              >
                <Text style={styles.periodFilterText}>{periodLabel}</Text>
                <Ionicons name="filter" size={14} color="#718096" style={styles.filterIcon} />
              </TouchableOpacity>
            </View>

            {/* Chart Content or Loading / Empty / Error State */}
            {loading ? (
              <View style={styles.stateContainer} testID="chart-loading">
                <ActivityIndicator size="large" color={Colors.light.main} />
                <Text style={styles.stateText}>{t('reports.loading')}</Text>
              </View>
            ) : queryError ? (
              <View style={styles.emptyContainer} testID="chart-error-state">
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="shield-outline" size={36} color={Colors.light.error} />
                </View>
                <Text style={[styles.emptyText, { color: Colors.light.error, fontWeight: '600' }]}>
                  {queryError}
                </Text>
              </View>
            ) : !hasData ? (
              /* Scenario 3: Empty state when no records exist in selected range */
              <View style={styles.emptyContainer} testID="chart-empty-state">
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="analytics-outline" size={36} color="#A0AEC0" />
                </View>
                <Text style={styles.emptyText}>{t('reports.emptyState')}</Text>
              </View>
            ) : (
              /* Scenario 1 & 2: Active chart display with reactive updates */
              <View testID="chart-active-container">
                <UsageLineChart
                  data={chartData}
                  height={230}
                  unit={selectedReportType === 'usage' ? 'min' : 'acc'}
                  lineColor={Colors.light.main}
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
              <Ionicons name="print-outline" size={20} color="#374151" />
            </TouchableOpacity>

            {/* PDF Export Button */}
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={handleExportPdf}
              activeOpacity={0.7}
              testID="export-pdf-btn"
              accessibilityLabel={t('reports.exportPdf')}
            >
              <Ionicons name="document-text" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Period Selection Modal */}
      <Modal
        visible={showPeriodModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPeriodModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('reports.reportTypeLabel')}</Text>
            {[7, 15, 30].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.modalOption,
                  selectedPeriod === p && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedPeriod(p as PeriodOption);
                  setShowPeriodModal(false);
                }}
                testID={`period-option-${p}`}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedPeriod === p && styles.modalOptionTextSelected,
                  ]}
                >
                  {p === 7
                    ? t('reports.period7Days')
                    : p === 15
                    ? t('reports.period15Days')
                    : t('reports.period30Days')}
                </Text>
                {selectedPeriod === p && (
                  <Ionicons name="checkmark" size={18} color={Colors.light.main} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Type Modal */}
      <Modal
        visible={showReportTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportTypeModal(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('reports.reportTypeLabel')}</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                selectedReportType === 'usage' && styles.modalOptionSelected,
              ]}
              onPress={() => {
                setSelectedReportType('usage');
                setShowReportTypeModal(false);
              }}
              testID="type-option-usage"
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedReportType === 'usage' && styles.modalOptionTextSelected,
                ]}
              >
                {t('reports.reportTypeUsage')}
              </Text>
              {selectedReportType === 'usage' && (
                <Ionicons name="checkmark" size={18} color={Colors.light.main} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                selectedReportType === 'access' && styles.modalOptionSelected,
              ]}
              onPress={() => {
                setSelectedReportType('access');
                setShowReportTypeModal(false);
              }}
              testID="type-option-access"
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedReportType === 'access' && styles.modalOptionTextSelected,
                ]}
              >
                {t('reports.chartTitle')}
              </Text>
              {selectedReportType === 'access' && (
                <Ionicons name="checkmark" size={18} color={Colors.light.main} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFB',
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
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    lineHeight: 20,
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.light.main,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTextWrapper: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#718096',
    letterSpacing: 0.4,
    fontFamily: 'Open Sans',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: Colors.light.main,
    fontFamily: 'Open Sans',
  },
  periodFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodFilterText: {
    fontSize: 12,
    color: '#718096',
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
    color: '#718096',
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
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
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
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: Colors.light.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'Open Sans',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#F3E8FF',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Open Sans',
  },
  modalOptionTextSelected: {
    color: Colors.light.main,
    fontWeight: '600',
  },
});
