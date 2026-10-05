import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { LinkedAppointment, isAppointmentStatusCompatible } from '@/services/consultation-service';

export interface AppointmentSelectorProps {
  readonly appointments: LinkedAppointment[];
  readonly selectedAppointmentId?: string;
  readonly onSelectAppointment: (appointment: LinkedAppointment | null) => void;
  readonly error?: string;
}

export function AppointmentSelector({
  appointments,
  selectedAppointmentId,
  onSelectAppointment,
  error,
}: Readonly<AppointmentSelectorProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [isOpen, setIsOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId) ?? null;

  const handleSelect = (appt: LinkedAppointment | null) => {
    if (!appt) {
      setWarningMessage(null);
      onSelectAppointment(null);
      setIsOpen(false);
      return;
    }

    if (!isAppointmentStatusCompatible(appt.status)) {
      setWarningMessage(
        t(
          'registerConsultation.incompatibleAppointmentWarning',
          'Solo se pueden generar registros de consulta para citas en progreso o completadas, o en su defecto de forma independiente.'
        )
      );
      return;
    }

    setWarningMessage(null);
    onSelectAppointment(appt);
    setIsOpen(false);
  };

  const getStatusBadgeStyle = (status: string) => {
    const isCompatible = isAppointmentStatusCompatible(status);
    if (isCompatible) {
      return {
        bg: '#D1FAE5',
        text: '#065F46',
      };
    }
    return {
      bg: '#FEE2E2',
      text: '#991B1B',
    };
  };

  return (
    <View style={styles.container} testID="appointment-selector">
      <TouchableOpacity
        style={[styles.headerCard, !!error && styles.headerError]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
        testID="btn-toggle-appointment-selector"
      >
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={20} color={theme.main} />
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>
              {selectedAppointment
                ? `${selectedAppointment.treatmentName || 'Cita'} (${selectedAppointment.date})`
                : t('registerConsultation.independentConsultation', 'Sin cita previa (Consulta independiente)')}
            </Text>
            {selectedAppointment && (
              <Text style={styles.headerSubtitle}>
                {selectedAppointment.time} · {selectedAppointment.status.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.pageSubtitle}
        />
      </TouchableOpacity>

      {/* Warning de incompatibilidad */}
      {warningMessage && (
        <View style={styles.warningBanner} testID="incompatible-appointment-warning">
          <Ionicons name="alert-circle-outline" size={18} color="#B45309" />
          <Text style={styles.warningText}>{warningMessage}</Text>
        </View>
      )}

      {error && !warningMessage && (
        <Text style={styles.errorText} testID="appointment-error-text">{error}</Text>
      )}

      {/* Lista desplegable de citas */}
      {isOpen && (
        <View style={styles.dropdownList} testID="appointment-dropdown-list">
          <TouchableOpacity
            style={[styles.dropdownItem, !selectedAppointmentId && styles.dropdownItemSelected]}
            onPress={() => handleSelect(null)}
            testID="appointment-option-independent"
          >
            <Ionicons name="document-text-outline" size={18} color={theme.main} />
            <Text style={styles.dropdownItemText}>
              {t('registerConsultation.independentConsultation', 'Sin cita previa (Consulta independiente)')}
            </Text>
            {!selectedAppointmentId && (
              <Ionicons name="checkmark" size={18} color={theme.main} />
            )}
          </TouchableOpacity>

          {appointments.map((appt) => {
            const isSelected = selectedAppointmentId === appt.id;
            const isCompatible = isAppointmentStatusCompatible(appt.status);
            const badge = getStatusBadgeStyle(appt.status);

            return (
              <TouchableOpacity
                key={appt.id}
                style={[
                  styles.dropdownItem,
                  isSelected && styles.dropdownItemSelected,
                  !isCompatible && styles.dropdownItemDisabled,
                ]}
                onPress={() => handleSelect(appt)}
                testID={`appointment-option-${appt.id}`}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemTitle}>{appt.treatmentName || 'Cita Odontológica'}</Text>
                  <Text style={styles.itemDate}>
                    {appt.date} {appt.time ? `• ${appt.time}` : ''}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>
                    {appt.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    headerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    headerError: {
      borderColor: theme.error,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    headerTextCol: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      fontFamily: 'Open Sans',
    },
    dropdownList: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      marginTop: 6,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardSeparator,
    },
    dropdownItemSelected: {
      backgroundColor: theme.backgroundSelected,
    },
    dropdownItemDisabled: {
      opacity: 0.8,
    },
    dropdownItemText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
      fontFamily: 'Open Sans',
      flex: 1,
      marginLeft: 10,
    },
    itemLeft: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    itemDate: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
      fontFamily: 'Open Sans',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      marginLeft: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontFamily: 'Open Sans',
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      color: '#B45309',
      lineHeight: 16,
      fontFamily: 'Open Sans',
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
      fontFamily: 'Open Sans',
    },
  });
