import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

export type BreadcrumbProps = {
  parent: string;
  current: string;
};

export function Breadcrumb({ parent, current }: BreadcrumbProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.parentText}>{parent}</Text>
      <Text style={styles.chevron}>   ›   </Text>
      <Text style={styles.currentText}>{current}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  parentText: {
    color: '#718096',
    fontSize: 14,
    fontFamily: 'Open Sans',
  },
  chevron: {
    color: '#CBD5E0',
    fontSize: 14,
  },
  currentText: {
    color: Colors.light.header,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
});
