import { StyleSheet } from 'react-native';
import { createGlobalStyles } from './global.styles';

export const createStyles = (theme: any) => {
    const global = createGlobalStyles(theme);

  return StyleSheet.create({
    ...global,
    scroll: {
      flex: 1,
    },
    btnCambiar: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    btnCambiarText: {
      color: theme.textNames,
      fontSize: 14,
    },
    btnEliminarText: {
      color: theme.error,
      fontSize: 14,
    },
    avatarHelpText: {
      fontSize: 12,
      color: theme.placeholderColor,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.fieldLabel,
      marginTop: 15,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      height: 46,
      fontSize: 15,
      color: theme.fieldLabel,
      backgroundColor: theme.backgroundElement,
    },
    inputError: {
      borderColor: theme.error,
      borderWidth: 1.5,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: theme.backgroundElement,
    },
    emailIcon: {
      width: 18,
      height: 18,
      marginRight: 10,
    },
    emailInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: theme.fieldLabel,
    },
    textArea: {
      height: 90,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
    },
    languageIcon: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    languageDesc: {
      fontSize: 14,
      color: theme.pageSubtitle,
      marginBottom: 20,
      lineHeight: 20,
    },
    languageOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      backgroundColor: theme.backgroundElement,
    },
    languageOptionSelected: {
      borderColor: theme.main,
      borderWidth: 2,
    },
    languageTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.pageTitle,
      marginBottom: 4,
    },
    languageSubtitle: {
      fontSize: 13,
      color: theme.pageSubtitle,
    },
    checkIcon: {
      width: 24,
      height: 24,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 30,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    cancelBtnText: {
      color: theme.fieldLabel,
      fontWeight: '600',
      fontSize: 15,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    saveIcon: {
      width: 18,
      height: 18,
      marginRight: 8,
    },
    saveBtnText: {
      color: theme.overMain,
      fontWeight: '600',
      fontSize: 15,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    rowItem: {
      flexGrow: 1,
      flexBasis: 140,
      minWidth: 140,
    },
    rowItemWide: {
      flexGrow: 1.35,
      flexBasis: 160,
      minWidth: 160,
    },
})};