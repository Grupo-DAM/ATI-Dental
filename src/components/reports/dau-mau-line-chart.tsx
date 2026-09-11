import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { buildBezierPath } from './usage-line-chart';

export interface DauMauDataPoint {
  label: string;
  mau: number;
  dau: number;
}

export interface DauMauLineChartProps {
  data: DauMauDataPoint[];
  height?: number;
  testID?: string;
}

const DEFAULT_CHART_HEIGHT = 230;

export function DauMauLineChart({
  data,
  height = DEFAULT_CHART_HEIGHT,
  testID = 'dau-mau-line-chart',
}: Readonly<DauMauLineChartProps>) {
  const { t } = useTranslation();
  const [containerWidth, setContainerWidth] = useState(340);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 50) {
      setContainerWidth(width);
    }
  };

  const paddingLeft = 36;
  const paddingRight = 44;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = Math.max(containerWidth - paddingLeft - paddingRight, 50);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 50);

  const maxValue = 180;
  const yTicks = [0, 60, 120, 180];

  const mauPoints = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
      const normalizedY = Math.min(Math.max(d.mau / maxValue, 0), 1);
      const y = paddingTop + chartHeight - normalizedY * chartHeight;
      return { x, y, value: d.mau };
    });
  }, [data, chartWidth, chartHeight]);

  const dauPoints = useMemo(() => {
    if (data.length === 0) return [];
    return data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
      const normalizedY = Math.min(Math.max(d.dau / maxValue, 0), 1);
      const y = paddingTop + chartHeight - normalizedY * chartHeight;
      return { x, y, value: d.dau };
    });
  }, [data, chartWidth, chartHeight]);

  const mauPath = useMemo(() => buildBezierPath(mauPoints), [mauPoints]);
  const dauPath = useMemo(() => buildBezierPath(dauPoints), [dauPoints]);

  const lastMauPoint = mauPoints.length > 0 ? mauPoints[mauPoints.length - 1] : null;
  const lastDauPoint = dauPoints.length > 0 ? dauPoints[dauPoints.length - 1] : null;

  return (
    <View style={styles.container} onLayout={handleLayout} testID={testID}>
      {/* Leyenda superior del gráfico */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.light.header }]} />
          <Text style={styles.legendText}>{t('reports.mauLegend')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8E5CBF' }]} />
          <Text style={styles.legendText}>{t('reports.dauLegend')}</Text>
        </View>
      </View>

      {/* Gráfico SVG */}
      <View style={styles.svgWrapper}>
        <Svg width={containerWidth} height={height}>
          {/* Líneas de la cuadrícula horizontal y etiquetas de Y */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
            return (
              <React.Fragment key={tick}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartWidth}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <SvgText
                  x={paddingLeft - 8}
                  y={y + 4}
                  fontSize="11"
                  fill={Colors.light.textSecondary}
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Etiquetas del eje X (Abr, May, Jun, ...) */}
          {data.map((d, index) => {
            const x = paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
            return (
              <SvgText
                key={d.label}
                x={x}
                y={paddingTop + chartHeight + 18}
                fontSize="11"
                fill={Colors.light.textSecondary}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}

          {/* Curva MAU (Línea superior) */}
          {mauPath ? (
            <Path d={mauPath} fill="none" stroke={Colors.light.header} strokeWidth="2.5" />
          ) : null}

          {/* Curva DAU (Línea inferior) */}
          {dauPath ? (
            <Path d={dauPath} fill="none" stroke="#8E5CBF" strokeWidth="2.5" />
          ) : null}
        </Svg>

        {lastMauPoint && (
          <View
            style={[
              styles.floatingBadge,
              { left: lastMauPoint.x + 4, top: lastMauPoint.y - 10, backgroundColor: Colors.light.header },
            ]}
          >
            <Text style={styles.floatingBadgeText}>{lastMauPoint.value}</Text>
          </View>
        )}
        {lastDauPoint && (
          <View
            style={[
              styles.floatingBadge,
              { left: lastDauPoint.x + 4, top: lastDauPoint.y - 10, backgroundColor: '#8E5CBF' },
            ]}
          >
            <Text style={styles.floatingBadgeText}>{lastDauPoint.value}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontFamily: 'Open Sans',
  },
  svgWrapper: {
    position: 'relative',
  },
  floatingBadge: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});