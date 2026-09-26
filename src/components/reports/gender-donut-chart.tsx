import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { GenderBucket, GenderSlice } from './types';

const SLICE_COLORS: Record<GenderBucket, string> = {
  female: '#5B2D8B',
  male: '#B39DDB',
  unspecified: '#EDE4F5',
};

const LABEL_KEYS: Record<GenderBucket, string> = {
  female: 'reports.genderFemale',
  male: 'reports.genderMale',
  unspecified: 'reports.genderUnspecified',
};

interface GenderDonutChartProps {
  data: GenderSlice[];
  total: number;
  testID?: string;
}

import { describeDonutSlice, useDonutSlices } from './utils/donut-utils';
export function GenderDonutChart({
  data,
  total,
  testID = 'reports-gender-donut-chart',
}: Readonly<GenderDonutChartProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 68;
  const innerRadius = 42;

  const slices = useDonutSlices(data, total, cx, cy, outerRadius, innerRadius);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.chartWrap}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((slice) =>
            slice.d ? (
              <Path key={slice.key} d={slice.d} fill={SLICE_COLORS[slice.key]} />
            ) : null,
          )}
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerValue} testID="gender-donut-total">
            {total}
          </Text>
          <Text style={styles.centerCaption}>{t('reports.genderTotal')}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.key} style={styles.legendItem} testID={`gender-legend-${item.key}`}>
            <View style={[styles.legendDot, { backgroundColor: SLICE_COLORS[item.key] }]} />
            <Text style={styles.legendText}>
              {t(LABEL_KEYS[item.key])} {item.percent}% ({item.count})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 8,
    },
    chartWrap: {
      width: 168,
      height: 168,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerLabel: {
      position: 'absolute',
      alignItems: 'center',
    },
    centerValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.reportValueText,
      fontFamily: 'Open Sans',
    },
    centerCaption: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    legend: {
      flex: 1,
      gap: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      flex: 1,
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
  });
