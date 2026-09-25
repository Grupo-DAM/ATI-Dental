import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { Consultation } from '@/types/clinical-record';

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

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('clinicalHistory.searchPlaceholder', 'Buscar por motivo, diagnostico o fecha')}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
          clearButtonMode="while-editing"
          testID="search-consultations-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {consultations.length === 0 ? (
        <View style={styles.emptyContainer} testID="empty-consultations">
          <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? t('clinicalHistory.noSearchResults', 'Sin resultados')
              : t('clinicalHistory.noConsultations', 'Sin consultas registradas')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? t('clinicalHistory.noSearchResultsDesc', 'No se encontraron consultas que coincidan con la búsqueda.')
              : t('clinicalHistory.noConsultationsDesc', 'Este paciente aún no posee consultas odontológicas registradas.')}
          </Text>
        </View>
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

              {/* Actions Footer */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onModifyConsultation?.(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={14} color="#6B7280" />
                  <Text style={styles.actionText}>Modificar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onDeleteConsultation?.(item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color="#6B7280" />
                  <Text style={styles.actionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.main,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    paddingVertical: 0,
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
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  monthYearText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Open Sans',
    textAlign: 'center',
    marginBottom: 6,
  },
  markerCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.light.main,
    backgroundColor: '#FFFFFF',
  },
  connectingLine: {
    position: 'absolute',
    top: 48,
    bottom: -20,
    width: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: Colors.light.main,
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
    color: '#4B5563',
    fontFamily: 'Open Sans',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    flex: 1,
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Open Sans',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
    textAlign: 'center',
    marginTop: 4,
  },
});
