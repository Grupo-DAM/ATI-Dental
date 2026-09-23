import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { CountryBucket } from './types';

interface CountryBarChartProps {
  data: CountryBucket[];
  testID?: string;
}

export function CountryBarChart({ data, testID = 'reports-country-bar-chart' }: Readonly<CountryBarChartProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <View style={styles.container} testID={testID}>
      {data.map((item) => {
        const widthPercent = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
        return (
          <View key={item.key} style={styles.row} testID={`country-bar-${item.key}`}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${widthPercent}%`,
                    backgroundColor: theme.logo,
                  },
                ]}
              />
            </View>
            <Text style={styles.count}>{item.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingVertical: 8,
    },
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
