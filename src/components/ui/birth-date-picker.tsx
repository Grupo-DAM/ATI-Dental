import React from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SystemDatePicker } from '@/components/ui/system-date-picker';
import { useTheme } from '@/hooks/use-theme';

export const MIN_BIRTH_DATE = new Date(1900, 0, 1);

export function formatBirthDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

type BirthDatePickerProps = {
  visible: boolean;
  value: Date;
  title: string;
  confirmLabel: string;
  pickerTestID: string;
  modalTestID?: string;
  confirmTestID?: string;
  locale: string;
  onClose: () => void;
  onSelect: (date: Date) => void;
};

export function BirthDatePicker({
  visible,
  value,
  title,
  confirmLabel,
  pickerTestID,
  modalTestID,
  confirmTestID = 'btn-confirm-birth-date',
  locale,
  onClose,
  onSelect,
}: Readonly<BirthDatePickerProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleChange = (event: { type?: string }, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      onClose();
    }
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    onSelect(selectedDate);
  };

  const picker = (
    <SystemDatePicker
      testID={pickerTestID}
      value={value}
      mode="date"
      display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
      maximumDate={new Date()}
      minimumDate={MIN_BIRTH_DATE}
      onChange={handleChange}
      locale={locale}
    />
  );

  if (Platform.OS === 'android') {
    return visible ? picker : null;
  }

  return (
    <Modal
      testID={modalTestID}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.datePickerOverlay}>
        <View style={styles.datePickerCard}>
          <Text style={styles.datePickerTitle}>{title}</Text>
          {picker}
          <TouchableOpacity testID={confirmTestID} style={styles.primaryButton} onPress={onClose}>
            <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    datePickerOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: theme.tooltipBackground,
    },
    datePickerCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    datePickerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.pageTitle,
      marginBottom: 8,
    },
    primaryButton: {
      marginTop: 12,
      backgroundColor: theme.main,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      color: theme.overMain,
      fontWeight: '600',
      fontSize: 15,
    },
  });
