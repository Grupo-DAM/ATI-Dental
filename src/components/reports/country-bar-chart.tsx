import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { CountryBucket } from './types';
import { SimpleBarRow } from './utils/bar-utils';

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
      {data.map((item) => (
        <SimpleBarRow
          key={item.key}
          label={item.label}
          count={item.count}
          maxCount={maxCount}
          color={theme.logo}
          testID={`country-bar-${item.key}`}
          theme={theme}
        />
      ))}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
      paddingVertical: 8,
    },
  });
