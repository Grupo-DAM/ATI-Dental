import React, { useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { createScheduleAppointmentButtonStyles } from '@/constants/styles/schedule-appointment-button.styles';
import { useTheme } from '@/hooks/use-theme';

export function ScheduleAppointmentButton({
  onPress,
  testID = 'btn-schedule-appointment',
}: Readonly<{
  onPress: () => void;
  testID?: string;
}>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createScheduleAppointmentButtonStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      testID={testID}
    >
      <Ionicons name="calendar" size={14} color="#FFFFFF" />
      <Text style={styles.label}>
        {t('clinicalHistory.scheduleAppointment', 'Agendar Cita')}
      </Text>
    </TouchableOpacity>
  );
}
