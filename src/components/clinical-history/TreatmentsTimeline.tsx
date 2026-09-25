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
import { useTheme } from '@/hooks/use-theme';
import { Treatment } from '@/services/treatment-service';

function formatTreatmentDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr || '—';
  }
}

function getStatusStyle(status?: string): { bg: string; text: string } {
  const s = (status || '').toLowerCase();
  if (s.includes('complet')) return { bg: '#E8F5E9', text: '#2E7D32' };
  if (s.includes('progreso')) return { bg: '#FFF3E0', text: '#E65100' };
  if (s.includes('pendiente')) return { bg: '#FFF8E1', text: '#F57F17' };
  if (s.includes('cancel')) return { bg: '#FFEBEE', text: '#C62828' };
  return { bg: '#F3F4F6', text: '#4B5563' };
}

interface Props {
  readonly treatments: Treatment[];
  readonly searchQuery: string;
  readonly onSearchChange: (q: string) => void;
  readonly onAddTreatment: () => void;
  readonly onModifyTreatment: (treatmentId: string) => void;
  readonly onDeleteTreatment: (treatmentId: string) => void;
}

export function TreatmentsTimeline({
  treatments,
  searchQuery,
  onSearchChange,
  onAddTreatment,
  onModifyTreatment,
  onDeleteTreatment,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container} testID="treatments-timeline">
      {/* Header Row: Title & Añadir */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          {t('clinicalHistory.treatmentHistory', 'Historial de Tratamientos')}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddTreatment}
          activeOpacity={0.7}
          testID="btn-add-treatment"
        >
          <Text style={styles.addButtonText}>
            {t('clinicalHistory.add', 'Añadir')}
          </Text>
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={theme.placeholderColor} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('clinicalHistory.searchPlaceholder', 'Buscar por motivo, diagnostico o fecha')}
          placeholderTextColor={theme.placeholderColor}
          value={searchQuery}
          onChangeText={onSearchChange}
          clearButtonMode="while-editing"
          testID="search-treatments-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={16} color={theme.placeholderColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Empty State */}
      {treatments.length === 0 ? (
        <View style={styles.emptyContainer} testID="empty-treatments">
          <Ionicons name="clipboard-outline" size={48} color={theme.pageSubtitle} />
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? t('clinicalHistory.noSearchResults', 'Sin resultados')
              : t('clinicalHistory.noTreatments', 'Sin tratamientos registrados')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? t('clinicalHistory.noSearchResultsDesc', 'No se encontraron tratamientos que coincidan.')
              : t('clinicalHistory.noTreatmentsDesc', 'Este paciente aún no tiene procedimientos registrados.')}
          </Text>
        </View>
      ) : null}

      {/* Treatments List */}
      {treatments.map((tr, index) => {
        const isLast = index === treatments.length - 1;
        const statusColors = getStatusStyle(tr.status);

        return (
          <View key={tr.id} style={styles.timelineItem} testID={`treatment-item-${tr.id}`}>
            {/* Left Icon Dot & Line */}
            <View style={styles.leftColumn}>
              <View style={styles.iconCircle}>
                <Ionicons name="bandage-outline" size={14} color={theme.main} />
              </View>
              {!isLast && <View style={styles.connectingLine} />}
            </View>

            {/* Right Card */}
            <View style={styles.card}>
              {/* Date & Badges */}
              <View style={styles.dateRow}>
                <Text style={styles.dateText}>{formatTreatmentDate(tr.treatmentDate)}</Text>
                <View style={styles.badgesGroup}>
                  {tr.status ? (
                    <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.badgeText, { color: statusColors.text }]}>
                        {tr.status}
                      </Text>
                    </View>
                  ) : null}
                  {tr.category ? (
                    <View style={[styles.badge, { backgroundColor: theme.accentBackground }]}>
                      <Text style={[styles.badgeText, { color: theme.main }]}>
                        {tr.category}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Treatment Name */}
              <Text style={styles.treatmentName}>{tr.treatmentName}</Text>

              {/* Notes */}
              {tr.notes ? (
                <Text style={styles.treatmentNotes} numberOfLines={2}>
                  {tr.notes}
                </Text>
              ) : null}

              {/* Meta row: Doctor, Duration, Dental piece */}
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={12} color={theme.pageSubtitle} />
                <Text style={styles.metaText}>{tr.responsibleDentist}</Text>

                {tr.duration ? (
                  <>
                    <Text style={styles.metaSeparator}>|</Text>
                    <Ionicons name="time-outline" size={12} color={theme.pageSubtitle} />
                    <Text style={styles.metaText}>{tr.duration}</Text>
                  </>
                ) : null}

                {tr.dentalPiece ? (
                  <>
                    <Text style={styles.metaSeparator}>|</Text>
                    <Ionicons name="medkit-outline" size={12} color={theme.pageSubtitle} />
                    <Text style={styles.metaText}>{tr.dentalPiece}</Text>
                  </>
                ) : null}
              </View>

              {/* Actions Footer */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => onModifyTreatment(tr.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={14} color={theme.pageSubtitle} />
                  <Text style={styles.actionText}>Modificar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => onDeleteTreatment(tr.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={theme.pageSubtitle} />
                  <Text style={styles.actionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      gap: 4,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
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
      color: theme.text,
      fontFamily: 'Open Sans',
      paddingVertical: 0,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    leftColumn: {
      width: 36,
      alignItems: 'center',
      position: 'relative',
      paddingTop: 4,
      marginRight: 10,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.accentBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.main,
    },
    connectingLine: {
      position: 'absolute',
      top: 36,
      bottom: -16,
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
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    badgesGroup: {
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      fontFamily: 'Open Sans',
    },
    treatmentName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginBottom: 4,
    },
    treatmentNotes: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      lineHeight: 17,
      marginBottom: 8,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
      flexWrap: 'wrap',
    },
    metaText: {
      fontSize: 11,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    metaSeparator: {
      fontSize: 11,
      color: theme.cardSeparator,
    },
    actionsFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: theme.pageSeparator,
      paddingTop: 8,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      textAlign: 'center',
      marginTop: 4,
    },
  });
