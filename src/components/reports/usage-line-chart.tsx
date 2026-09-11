import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/theme';

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
  fullDate?: string;
}

export interface UsageLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  unit?: string;
  lineColor?: string;
  testID?: string;
}

/**
 * Generates a smooth cubic Bezier path string from a set of 2D points.
 */
function buildBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return path;
}

export function UsageLineChart({
  data,
  height = 220,
  unit = 'min',
  lineColor = Colors.light.main,
  testID = 'usage-line-chart',
}: Readonly<UsageLineChartProps>) {
  const [containerWidth, setContainerWidth] = useState(340);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 50) {
      setContainerWidth(width);
    }
  };

  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 18;
  const paddingBottom = 28;

  const chartWidth = Math.max(containerWidth - paddingLeft - paddingRight, 50);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 50);

  // Compute max value with nice ceiling
  const rawMax = useMemo(() => {
    if (data.length === 0) return 100;
    const max = Math.max(...data.map((d) => d.value));
    return max <= 0 ? 100 : max;
  }, [data]);

  // Determine nice scale maximum (multiples of 20, 50, etc.)
  const maxValue = useMemo(() => {
    if (rawMax <= 20) return 20;
    if (rawMax <= 60) return 60;
    if (rawMax <= 100) return 100;
    if (rawMax <= 140) return 140;
    const step = Math.ceil(rawMax / 4 / 10) * 10;
    return step * 4;
  }, [rawMax]);

  const yTicks = useMemo(() => {
    const count = 4;
    const ticks: number[] = [];
    const step = maxValue / count;
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round(i * step));
    }
    return ticks;
  }, [maxValue]);

  // Points coordinates
  const points = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) {
      return [{
        x: paddingLeft + chartWidth / 2,
        y: paddingTop + chartHeight - (data[0].value / maxValue) * chartHeight,
      }];
    }

    return data.map((d, index) => {
      const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
      const normalizedY = Math.min(Math.max(d.value / maxValue, 0), 1);
      const y = paddingTop + chartHeight - normalizedY * chartHeight;
      return { x, y };
    });
  }, [data, chartWidth, chartHeight, maxValue]);

  const linePath = useMemo(() => buildBezierPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = paddingTop + chartHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX.toFixed(1)},${bottomY.toFixed(1)} L ${firstX.toFixed(1)},${bottomY.toFixed(1)} Z`;
  }, [linePath, points, chartHeight]);

  const selectedPoint = selectedIndex !== null && data[selectedIndex]
    ? { point: points[selectedIndex], data: data[selectedIndex] }
    : null;

  return (
    <View style={styles.container} onLayout={handleLayout} testID={testID}>
      {/* Tooltip Overlay */}
      {selectedPoint && (
        <View
          style={[
            styles.tooltip,
            {
              left: Math.min(Math.max(selectedPoint.point.x - 45, 8), containerWidth - 98),
              top: Math.max(selectedPoint.point.y - 42, 2),
            },
          ]}
          testID="chart-tooltip"
        >
          <Text style={styles.tooltipDate}>
            {selectedPoint.data.date ? `Día ${selectedPoint.data.date}` : selectedPoint.data.label}
          </Text>
          <Text style={styles.tooltipVal}>
            {selectedPoint.data.value} {unit}
          </Text>
        </View>
      )}

      <Svg width={containerWidth} height={height}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
            <Stop offset="60%" stopColor={lineColor} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>

        {/* Y Grid Lines and Labels */}
        {yTicks.map((tick) => {
          const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <React.Fragment key={`grid-${tick}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={containerWidth - paddingRight}
                y2={y}
                stroke="#EDF2F7"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 3.5}
                fill="#A0AEC0"
                fontSize={10}
                fontWeight="500"
                textAnchor="end"
              >
                {tick}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X Axis Baseline */}
        <Line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={containerWidth - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="#CBD5E0"
          strokeWidth={1}
        />

        {/* X Labels */}
        {data.map((d, index) => {
          const step = Math.max(1, Math.floor(data.length / 6));
          const shouldShow = index % step === 0 || index === data.length - 1;
          if (!shouldShow || !points[index]) return null;

          return (
            <SvgText
              key={`x-label-${d.label}-${index}`}
              x={points[index].x}
              y={paddingTop + chartHeight + 18}
              fill="#A0AEC0"
              fontSize={10}
              fontWeight="500"
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}

        {/* Shaded Area */}
        {areaPath ? (
          <Path d={areaPath} fill="url(#chartGradient)" />
        ) : null}

        {/* Curve Line */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Points with white center (matching 1.jpg style) */}
        {points.map((p, index) => {
          const isSelected = selectedIndex === index;
          return (
            <React.Fragment key={`point-${index}`}>
              <Circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 6 : 4.5}
                fill={lineColor}
              />
              <Circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 3.5 : 2.5}
                fill="#FFFFFF"
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Touch targets over points for interaction */}
      {points.map((p, index) => (
        <TouchableOpacity
          key={`touch-${index}`}
          testID={`chart-point-${index}`}
          style={[
            styles.touchTarget,
            {
              left: p.x - 16,
              top: p.y - 16,
            },
          ]}
          onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginVertical: 8,
  },
  touchTarget: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    zIndex: 10,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#1A202C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    minWidth: 80,
  },
  tooltipDate: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '500',
  },
  tooltipVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
