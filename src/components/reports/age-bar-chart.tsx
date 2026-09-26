import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { AgeBucket, AgeBucketKey } from './types';
import { SimpleBarRow } from './utils/bar-utils';

const BAR_COLORS: Record<AgeBucketKey, string> = {
  '18_25': '#C4B0DC',
  '26_35': '#5B2D8B',
  '36_50': '#9B7BB8',
  '50_plus': '#D4C4E8',
  unspecified: '#EDE4F5',
};

const LABEL_KEYS: Record<AgeBucketKey, string> = {
  '18_25': 'reports.ageRange18_25',
  '26_35': 'reports.ageRange26_35',
  '36_50': 'reports.ageRange36_50',
  '50_plus': 'reports.ageRange50Plus',
  unspecified: 'reports.ageRangeUnspecified',
};

interface AgeBarChartProps {
  data: AgeBucket[];
  testID?: string;
}

export function AgeBarChart({ data, testID = 'reports-age-bar-chart' }: Readonly<AgeBarChartProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <View style={styles.container} testID={testID}>
      {data.map((item) => (
        <SimpleBarRow
          key={item.key}
          label={t(LABEL_KEYS[item.key])}
          count={item.count}
          maxCount={maxCount}
          color={BAR_COLORS[item.key]}
          testID={`age-bar-${item.key}`}
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
