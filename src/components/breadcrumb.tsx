import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BreadcrumbProps = {
  parent?: string;
  current: string;
  onParentPress?: () => void;
  parentRoute?: string;
};

export function Breadcrumb({ parent, current, onParentPress, parentRoute, }: Readonly<BreadcrumbProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const handleParentPress = () => {
     if (onParentPress) {
       onParentPress();
     } else if (parentRoute) {
       router.push(parentRoute as any);
     } else if (router.canGoBack()) {
       router.back();
     }
  };
  return (
    <View style={styles.container}>
      {Boolean(parent) && (
        <>
          <TouchableOpacity
            testID="breadcrumb-parent-btn"
            onPress={handleParentPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.parentText}>{parent}</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>   ›   </Text>
        </>
      )}
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
    textDecorationLine: 'underline', // Da feedback visual de que es interactivo
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
