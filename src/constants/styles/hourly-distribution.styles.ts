import { StyleSheet } from 'react-native';

export const createHourlyDistributionStyles = (theme: {
  main: string;
  backgroundElement: string;
  cardSeparator: string;
  pageTitle: string;
  pageSubtitle: string;
}) =>
  StyleSheet.create({
    insightCard: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      padding: 16,
      marginBottom: 16,
      gap: 8,
    },
    insightTitle: {
      color: theme.pageSubtitle,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Open Sans',
      letterSpacing: 0.4,
    },
    insightPeak: {
      color: theme.pageTitle,
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Open Sans',
    },
    downloadBtnDisabled: {
      opacity: 0.4,
    },
    filterGap: {
      marginBottom: 16,
    },
    dayFieldPress: {
      flex: 1,
    },
  });
