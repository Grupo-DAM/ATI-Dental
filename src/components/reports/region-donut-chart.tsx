import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { RegionBucket, RegionSlice } from './types';
import { useDonutSlices } from './utils/donut-utils';

const SLICE_COLORS: Record<RegionBucket, string> = {
  andina: '#5B2D8B',
  caribe: '#8B5BBD',
  pacifica: '#A989C8',
  otros: '#CFC0DF',
};

interface RegionDonutChartProps {
  data: RegionSlice[];
  total: number;
  testID?: string;
}

export function RegionDonutChart({
  data,
  total,
  testID = 'reports-region-donut-chart',
}: Readonly<RegionDonutChartProps>) {
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
              <Path key={slice.key} d={slice.d} fill={SLICE_COLORS[slice.key] || '#EDE4F5'} />
            ) : null,
          )}
        </Svg>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={styles.centerValue} testID="region-donut-total">
            {total}
          </Text>
          <Text style={styles.centerCaption}>{t('reports.regionTotal')}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((item) => (
          <View key={item.key} style={styles.legendItem} testID={`region-legend-${item.key}`}>
            <View style={[styles.legendDot, { backgroundColor: SLICE_COLORS[item.key] || '#EDE4F5' }]} />
            <Text style={styles.legendText}>
              <Text style={{fontWeight: '700', color: theme.text}}>{item.label}</Text> ({item.percent}%)
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 16,
      gap: 10,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '45%',
      gap: 8,
      marginBottom: 8,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
  });
