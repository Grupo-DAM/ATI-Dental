import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Consultation } from '@/types/clinical-record';
import {
  TimelineSearchBar,
  TimelineItemActions,
  TimelineEmptyState,
} from './TimelineComponents';

function formatTimelineDate(dateStr?: string): { day: string; monthYear: string } {
  if (!dateStr) return { day: '—', monthYear: '—' };
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return { day: '—', monthYear: dateStr };
    }
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return { day, monthYear: `${month} ${year}` };
  } catch {
    return { day: '—', monthYear: dateStr || '—' };
  }
}

interface Props {
  readonly consultations: Consultation[];
  readonly searchQuery: string;
  readonly onSearchChange: (q: string) => void;
  readonly onScheduleAppointment: () => void;
  readonly onSelectConsultation: (consultation: Consultation) => void;
  readonly onModifyConsultation?: (consultation: Consultation) => void;
  readonly onDeleteConsultation?: (consultationId: string) => void;
}

export function ConsultationsTimeline({
  consultations,
  searchQuery,
  onSearchChange,
  onScheduleAppointment,
  onSelectConsultation,
  onModifyConsultation,
  onDeleteConsultation,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container} testID="consultations-timeline">
      {/* Header Row: Title & Agendar Cita */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          {t('clinicalHistory.tabs.consultations', 'Consultas')}
        </Text>
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={onScheduleAppointment}
          activeOpacity={0.7}
          testID="btn-schedule-appointment"
        >
          <Ionicons name="calendar" size={14} color="#FFFFFF" />
          <Text style={styles.scheduleButtonText}>
            {t('clinicalHistory.scheduleAppointment', 'Agendar Cita')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reusable Search Input */}
      <TimelineSearchBar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        placeholder={t('clinicalHistory.searchPlaceholder', 'Buscar por motivo, diagnostico o fecha')}
        testID="search-consultations-input"
      />

      {/* Reusable Empty State */}
      {consultations.length === 0 ? (
        <TimelineEmptyState
          icon="calendar-outline"
          title={searchQuery
            ? t('clinicalHistory.noSearchResults', 'Sin resultados')
            : t('clinicalHistory.noConsultations', 'Sin consultas registradas')}
          subtitle={searchQuery
            ? t('clinicalHistory.noSearchResultsDesc', 'No se encontraron consultas que coincidan con la búsqueda.')
            : t('clinicalHistory.noConsultationsDesc', 'Este paciente aún no posee consultas odontológicas registradas.')}
          testID="empty-consultations"
        />
      ) : null}

      {/* Timeline List */}
      {consultations.map((item, index) => {
        const { day, monthYear } = formatTimelineDate(item.consultationDate);
        const isLast = index === consultations.length - 1;

        return (
          <View key={item.id} style={styles.timelineItem} testID={`consultation-item-${item.id}`}>
            {/* Left Date & Marker Column */}
            <View style={styles.dateColumn}>
              <Text style={styles.dayText}>{day}</Text>
              <Text style={styles.monthYearText}>{monthYear}</Text>
              <View style={styles.markerCircle} />
              {!isLast && <View style={styles.connectingLine} />}
            </View>

            {/* Right Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectConsultation(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Motivo: </Text>
                <Text style={styles.detailValue}>{item.motivo}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Diagnóstico: </Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {item.diagnostico}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Próxima cita: </Text>
                <Text style={styles.detailValue}>
                  {item.proximaCita || 'No programada'}
                </Text>
              </View>

              {/* Reusable Actions Footer */}
              <TimelineItemActions
                onModify={() => onModifyConsultation?.(item)}
                onDelete={() => onDeleteConsultation?.(item.id)}
                modifyTestID={`btn-modify-consultation-${item.id}`}
              />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    scheduleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      gap: 6,
    },
    scheduleButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    dateColumn: {
      width: 64,
      alignItems: 'center',
      position: 'relative',
      paddingTop: 2,
      marginRight: 8,
    },
    dayText: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    monthYearText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      textAlign: 'center',
      marginBottom: 6,
    },
    markerCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: theme.main,
      backgroundColor: theme.backgroundElement,
    },
    connectingLine: {
      position: 'absolute',
      top: 48,
      bottom: -20,
      width: 2,
      backgroundColor: theme.cardSeparator,
      alignSelf: 'center',
    },
    card: {
      flex: 1,
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.main,
      fontFamily: 'Open Sans',
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 4,
      alignItems: 'flex-start',
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.fieldLabel,
      fontFamily: 'Open Sans',
    },
    detailValue: {
      fontSize: 12,
      color: theme.text,
      fontFamily: 'Open Sans',
      flex: 1,
    },
  });
