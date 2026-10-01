import { StyleSheet } from 'react-native';

export const createScheduleAppointmentButtonStyles = (theme: { main: string }) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      gap: 6,
    },
    label: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
  });
