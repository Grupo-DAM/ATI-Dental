import { StyleSheet } from 'react-native';

export const createAccessDeniedStyles = (theme: {
  background: string;
  pageTitle: string;
  pageSubtitle: string;
}) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.pageTitle,
    fontFamily: 'Open Sans',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: theme.pageSubtitle,
    fontFamily: 'Open Sans',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
