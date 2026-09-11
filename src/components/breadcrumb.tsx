import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BreadcrumbProps = {
  parent: string;
  current: string;
};

export function Breadcrumb({ parent, current }: Readonly<BreadcrumbProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.parentText}>{parent}</Text>
      <Text style={styles.chevron}>   ›   </Text>
      <Text style={styles.currentText}>{current}</Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: theme.pageSeparator,
  },
  parentText: {
    color: theme.pageSubtitle,
    fontSize: 14,
    fontFamily: 'Open Sans',
  },
  chevron: {
    color: theme.breadcrumbSeparator,
    fontSize: 14,
  },
  currentText: {
    color: theme.header,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
});
