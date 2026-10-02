import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export type AppTheme = typeof Colors.light;

export const createConsultationRecordStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    formContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 16,
    },
    fieldGroup: {
      marginBottom: 4,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.fieldLabel,
      fontFamily: 'Open Sans',
    },
    optionalBadge: {
      fontSize: 12,
      color: theme.textSecondary,
      fontFamily: 'Open Sans',
      fontStyle: 'italic',
    },
    input: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    textArea: {
      minHeight: 88,
      textAlignVertical: 'top',
    },
    inputError: {
      borderColor: theme.error,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
      fontFamily: 'Open Sans',
    },
    // Appointment link section
    appointmentCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 8,
    },
    appointmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    appointmentTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    appointmentStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    appointmentStatusText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      fontFamily: 'Open Sans',
    },
    appointmentDetail: {
      fontSize: 13,
      color: theme.textSecondary,
      fontFamily: 'Open Sans',
    },
    warningCard: {
      backgroundColor: theme.offlineBannerBackground || '#FEF3C7',
      borderColor: theme.offlineBannerBorder || '#FDE68A',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    warningText: {
      flex: 1,
      fontSize: 12,
      color: theme.offlineBannerText || '#B45309',
      lineHeight: 18,
      fontFamily: 'Open Sans',
    },
    // Odontogram trigger / preview card
    odontogramCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      gap: 10,
    },
    odontogramButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.accentBackground || '#F3E8FF',
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    odontogramButtonText: {
      color: theme.main,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    // Action bar buttons
    actionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 12,
      marginBottom: 32,
    },
    btnCancel: {
      flex: 1,
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnCancelText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    btnSubmit: {
      flex: 1.5,
      backgroundColor: theme.main,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    btnSubmitText: {
      color: theme.overMain,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Open Sans',
    },
    btnDisabled: {
      opacity: 0.6,
    },
  });
