import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';
import { RetentionDataPoint } from './types';
import { formatRetentionPercentage } from './utils/reports-utils';

export interface RetentionBarChartProps {
  data: RetentionDataPoint[];
  height?: number;
  testID?: string;
}

const DEFAULT_CHART_HEIGHT = 230;

export function RetentionBarChart({
  data,
  height = DEFAULT_CHART_HEIGHT,
  testID = 'retention-bar-chart',
}: Readonly<RetentionBarChartProps>) {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(340);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 50) {
      setContainerWidth(width);
    }
  };

  const paddingLeft = 40;
  const paddingRight = 24;
  const paddingTop = 26;
  const paddingBottom = 30;

  const chartWidth = Math.max(containerWidth - paddingLeft - paddingRight, 50);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 50);

  const yTicks = [0, 25, 50, 75, 100];
  const itemsCount = data.length || 3;
  const slotWidth = chartWidth / itemsCount;
  const barWidth = Math.min(Math.max(slotWidth * 0.45, 28), 64);

  return (
    <View style={styles.container} onLayout={handleLayout} testID={testID}>
      <Svg width={containerWidth} height={height}>
        <Defs>
          <LinearGradient id="retentionBarGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={theme.main} stopOpacity="1" />
            <Stop offset="100%" stopColor={theme.main} stopOpacity="0.75" />
          </LinearGradient>
        </Defs>

        {/* Cuadrícula horizontal y etiquetas del eje Y */}
        {yTicks.map((tick) => {
          const y = paddingTop + chartHeight - (tick / 100) * chartHeight;
          return (
            <React.Fragment key={tick}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + chartWidth}
                y2={y}
                stroke={tick === 0 ? theme.lineChartBottomLine : theme.pageSeparator}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : '3, 4'}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize={10}
                fill={theme.chartLegendText || '#9CA3AF'}
                textAnchor="end"
                fontWeight="500"
              >
                {`${tick}%`}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Barras de cohorte */}
        {data.map((item, index) => {
          const slotCenter = paddingLeft + (index + 0.5) * slotWidth;
          const barX = slotCenter - barWidth / 2;
          const clampedPercentage = Math.min(Math.max(item.percentage, 0), 100);
          const barH = (clampedPercentage / 100) * chartHeight;
          const barY = paddingTop + chartHeight - barH;
          const percentageText = formatRetentionPercentage(item.percentage);

          return (
            <React.Fragment key={item.cohort || item.label || index}>
              {/* Barra de fondo (track 100%) */}
              <Rect
                x={barX}
                y={paddingTop}
                width={barWidth}
                height={chartHeight}
                rx={6}
                ry={6}
                fill={theme.accentBackground || '#F1F5F9'}
                opacity={0.6}
              />

              {/* Barra rellena con porcentaje alcanzado */}
              {barH > 0 && (
                <Rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  ry={6}
                  fill="url(#retentionBarGrad)"
                />
              )}

              {/* Etiqueta de porcentaje superior */}
              <SvgText
                x={slotCenter}
                y={Math.max(barY - 8, paddingTop - 8)}
                fontSize={11}
                fill={theme.reportValueText || '#1F2937'}
                textAnchor="middle"
                fontWeight="700"
              >
                {percentageText}
              </SvgText>

              {/* Etiqueta del eje X (Cohorte: ej. Día 1) */}
              <SvgText
                x={slotCenter}
                y={paddingTop + chartHeight + 20}
                fontSize={11}
                fill={theme.pageSubtitle || '#6B7280'}
                textAnchor="middle"
                fontWeight="600"
              >
                {item.cohort}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
