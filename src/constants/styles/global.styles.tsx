import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/theme';

export type AppTheme = typeof Colors.light;

export const createGlobalStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    safeContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    titleSection: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    mainTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    card: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    separator: {
      height: 1,
      backgroundColor: theme.cardSeparator,
      marginVertical: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.fieldLabel,
      marginBottom: 6,
      fontFamily: 'Open Sans',
    },
    requiredAsterisk: {
      color: theme.error,
      fontWeight: '700',
    },
    input: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    inputMultiline: {
      minHeight: 84,
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
    buttonPrimary: {
      backgroundColor: theme.main,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonPrimaryText: {
      color: theme.overMain,
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    buttonSecondary: {
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonSecondaryText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    accessDeniedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
      fontFamily: 'Open Sans',
    },
    accessDeniedDesc: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      fontFamily: 'Open Sans',
    },
  });
