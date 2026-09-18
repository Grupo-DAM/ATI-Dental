import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { AgeBucket, AgeBucketKey } from './types';

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
      {data.map((item) => {
        const widthPercent = Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 0);
        return (
          <View key={item.key} style={styles.row} testID={`age-bar-${item.key}`}>
            <Text style={styles.label} numberOfLines={1}>
              {t(LABEL_KEYS[item.key])}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${widthPercent}%`,
                    backgroundColor: BAR_COLORS[item.key],
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
