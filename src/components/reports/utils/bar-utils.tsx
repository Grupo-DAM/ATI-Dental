import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SimpleBarRowProps {
  label: string;
  count: number;
  maxCount: number;
  color: string;
  testID: string;
  theme: any;
}

export function SimpleBarRow({ label, count, maxCount, color, testID, theme }: Readonly<SimpleBarRowProps>) {
  const widthPercent = Math.max((count / maxCount) * 100, count > 0 ? 6 : 0);
  const styles = createStyles(theme);

  return (
    <View style={styles.row} testID={testID}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${widthPercent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    label: {
      width: 92,
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    track: {
      flex: 1,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.accentBackground,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 9,
    },
    count: {
      width: 28,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '700',
      color: theme.reportValueText,
      fontFamily: 'Open Sans',
    },
  });
