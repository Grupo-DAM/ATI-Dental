import { StyleSheet } from 'react-native';
import { Spacing, FontSize, FontWeight, Border, BottomTabInset } from '@/constants/theme';

export const createStyles = (theme: any) => {
  const isDark = theme.background === '#000000';

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.three,
      paddingBottom: BottomTabInset + Spacing.six,
      gap: Spacing.four,
    },

    // ─── Offline & Error Banner ───
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.offlineBannerBackground,
      borderColor: theme.offlineBannerBorder,
      borderWidth: Border.width.regular,
      borderRadius: Border.radius.regular,
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.three,
    },
    offlineBannerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.two,
    },
    offlineBannerIcon: {
      marginRight: Spacing.one,
    },
    offlineText: {
      color: theme.offlineBannerText,
      fontSize: FontSize.p,
      fontWeight: FontWeight.medium,
      flex: 1,
    },
    retryButton: {
      backgroundColor: theme.main,
      paddingHorizontal: Spacing.three,
      paddingVertical: Spacing.one,
      borderRadius: 4,
      marginLeft: Spacing.two,
    },
    retryButtonPressed: {
      opacity: 0.8,
    },
    retryButtonText: {
      color: theme.overMain,
      fontSize: FontSize.p,
      fontWeight: FontWeight.semibold,
    },

    // ─── Header & Greeting Section ───
    greetingSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.three,
    },
    greetingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.three,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: isDark ? '#2D1B4D' : '#E8EDF5',
    },
    greetingTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    greetingTitle: {
      fontSize: FontSize.h3,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    greetingSubtitle: {
      fontSize: FontSize.h5,
      fontWeight: FontWeight.regular,
      color: theme.pageSubtitle,
      marginTop: 2,
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: Border.radius.regular,
      borderWidth: Border.width.regular,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editButtonPressed: {
      backgroundColor: theme.backgroundSelected,
    },

    // ─── Search Bar ───
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderWidth: Border.width.regular,
      borderColor: theme.border,
      borderRadius: Border.radius.regular,
      paddingHorizontal: Spacing.three,
      height: 46,
      gap: Spacing.two,
    },
    searchContainerFocused: {
      borderColor: theme.main,
    },
    searchIcon: {
      opacity: 0.7,
    },
    searchInput: {
      flex: 1,
      fontSize: FontSize.p,
      color: theme.text,
      paddingVertical: Spacing.none,
      height: '100%',
    },
    clearSearchButton: {
      padding: Spacing.one,
    },

    // ─── Search Results ───
    searchResultsWrapper: {
      backgroundColor: theme.backgroundElement,
      borderWidth: Border.width.regular,
      borderColor: theme.border,
      borderRadius: Border.radius.regular,
      padding: Spacing.three,
      gap: Spacing.two,
    },
    searchResultsTitle: {
      fontSize: FontSize.p,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
      marginBottom: Spacing.one,
    },
    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.two,
      borderRadius: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.pageSeparator,
      gap: Spacing.two,
    },
    searchResultItemPressed: {
      backgroundColor: theme.backgroundSelected,
    },
    searchResultIcon: {
      marginRight: Spacing.one,
    },
    searchResultTextCol: {
      flex: 1,
    },
    searchResultTitle: {
      fontSize: FontSize.h5,
      fontWeight: FontWeight.semibold,
      color: theme.pageTitle,
    },
    searchResultSubtitle: {
      fontSize: FontSize.p,
      color: theme.pageSubtitle,
      marginTop: 2,
    },
    noResultsText: {
      fontSize: FontSize.p,
      color: theme.pageSubtitle,
      textAlign: 'center',
      paddingVertical: Spacing.two,
    },

    // ─── Section Card Wrapper ───
    sectionCardWrapper: {
      flex: 0,
      width: '100%',
    },
    sectionCardInner: {
      padding: Spacing.threeHalf,
      gap: Spacing.three,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      fontSize: FontSize.h4,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
    },
    agendaLink: {
      paddingVertical: Spacing.half,
      paddingHorizontal: Spacing.one,
    },
    agendaLinkText: {
      fontSize: FontSize.h5,
      fontWeight: FontWeight.bold,
      color: theme.main,
    },

    // ─── Resumen de Hoy Metrics ───
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },
    metricCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.three,
      paddingHorizontal: 10,
      borderRadius: Border.radius.regular,
      borderWidth: Border.width.regular,
      gap: Spacing.two,
      minHeight: 76,
    },
    metricNumber: {
      fontSize: 32,
      fontWeight: FontWeight.bold,
      lineHeight: 36,
    },
    metricLabel: {
      flex: 1,
      fontSize: FontSize.p,
      fontWeight: FontWeight.medium,
      lineHeight: 15,
    },

    // Card 1: Green (Citas pendientes)
    metricCardGreen: {
      backgroundColor: isDark ? '#122619' : '#EAF7EE',
      borderColor: isDark ? '#2E7D32' : '#8BD69E',
    },
    metricNumberGreen: {
      color: isDark ? '#4ADE80' : '#2E7D32',
    },
    metricLabelGreen: {
      color: isDark ? '#86EFAC' : '#2E7D32',
    },

    // Card 2: Orange (Pacientes pendientes)
    metricCardOrange: {
      backgroundColor: isDark ? '#29180E' : '#FEF3E8',
      borderColor: isDark ? '#D85A00' : '#F7C293',
    },
    metricNumberOrange: {
      color: isDark ? '#FB923C' : '#D85A00',
    },
    metricLabelOrange: {
      color: isDark ? '#FDBA74' : '#D85A00',
    },

    // Card 3: Blue (Examenes pendientes)
    metricCardBlue: {
      backgroundColor: isDark ? '#121E33' : '#EBF1FC',
      borderColor: isDark ? '#2F5EA8' : '#AEC5F3',
    },
    metricNumberBlue: {
      color: isDark ? '#60A5FA' : '#2F5EA8',
    },
    metricLabelBlue: {
      color: isDark ? '#93C5FD' : '#2F5EA8',
    },

    // ─── Accesos Rápidos ───
    quickAccessRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },
    quickAccessButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.three,
      paddingHorizontal: Spacing.two,
      borderRadius: Border.radius.regular,
      borderWidth: Border.width.regular,
      borderColor: isDark ? '#6B3BA6' : '#C7A8E8',
      backgroundColor: isDark ? '#23153A' : '#EFE8F9',
      minHeight: 76,
      gap: Spacing.oneHalf,
    },
    quickAccessButtonPressed: {
      opacity: 0.75,
    },
    quickAccessLabel: {
      fontSize: FontSize.p,
      fontWeight: FontWeight.semibold,
      color: isDark ? '#E9D5FF' : theme.main,
      textAlign: 'center',
    },

    // ─── Notificaciones ───
    notificationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.three,
    },
    notificationRowPressed: {
      opacity: 0.75,
    },
    notificationLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: Spacing.three,
    },
    notificationIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#351C57' : '#E5DBF3',
      alignItems: 'center',
      justifyContent: 'center',
    },
    notificationTextCol: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: FontSize.h5,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
    },
    notificationSubtitle: {
      fontSize: FontSize.p,
      color: theme.pageSubtitle,
      marginTop: 2,
    },
    notificationRight: {
      paddingLeft: Spacing.one,
    },
    unreadBadge: {
      backgroundColor: theme.alert,
      borderRadius: 12,
      paddingHorizontal: Spacing.oneHalf,
      paddingVertical: 2,
      marginLeft: Spacing.two,
    },
    unreadBadgeText: {
      color: '#ffffff',
      fontSize: 11,
      fontWeight: FontWeight.bold,
    },

    // ─── Skeleton Loaders ───
    skeletonRow: {
      flexDirection: 'row',
      gap: 10,
    },
    skeletonBox: {
      flex: 1,
      height: 76,
      borderRadius: Border.radius.regular,
      backgroundColor: theme.backgroundSelected,
      opacity: 0.6,
    },
    skeletonNotification: {
      height: 48,
      borderRadius: Border.radius.regular,
      backgroundColor: theme.backgroundSelected,
      opacity: 0.6,
    },

    // ─── Modal Styles (Customization & Notification Detail) ───
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.four,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.backgroundElement,
      borderRadius: Border.radius.wide,
      padding: Spacing.four,
      gap: Spacing.three,
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: Border.width.regular,
      borderBottomColor: theme.pageSeparator,
      paddingBottom: Spacing.two,
    },
    modalTitle: {
      fontSize: FontSize.h4,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
    },
    modalCloseBtn: {
      padding: Spacing.one,
    },
    modalItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.two,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.pageSeparator,
    },
    modalItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
    },
    modalItemText: {
      fontSize: FontSize.p,
      color: theme.pageTitle,
      fontWeight: FontWeight.medium,
    },
    modalCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: theme.main,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    modalCheckboxActive: {
      backgroundColor: theme.main,
    },
    modalActionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.two,
      marginTop: Spacing.two,
    },
    modalSecondaryButton: {
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.three,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
    },
    modalSecondaryButtonText: {
      color: theme.textNames,
      fontSize: FontSize.p,
      fontWeight: FontWeight.medium,
    },
    modalPrimaryButton: {
      backgroundColor: theme.main,
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.threeHalf,
      borderRadius: 4,
    },
    modalPrimaryButtonText: {
      color: theme.overMain,
      fontSize: FontSize.p,
      fontWeight: FontWeight.semibold,
    },
  });
};
