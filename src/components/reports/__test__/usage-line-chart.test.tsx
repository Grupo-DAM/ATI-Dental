import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { buildBezierPath, UsageLineChart } from '../usage-line-chart';

describe('usage-line-chart and buildBezierPath', () => {
  describe('buildBezierPath', () => {
    it('returns empty string when given 0 points', () => {
      expect(buildBezierPath([])).toBe('');
    });

    it('returns move command when given a single point', () => {
      expect(buildBezierPath([{ x: 10, y: 20 }])).toBe('M 10,20');
    });

    it('returns valid cubic bezier path when given multiple points', () => {
      const points = [
        { x: 0, y: 50 },
        { x: 50, y: 20 },
        { x: 100, y: 80 },
        { x: 150, y: 30 },
      ];
      const path = buildBezierPath(points);
      expect(path).toContain('M 0.0,50.0');
      expect(path).toContain('C ');
    });
  });

  describe('UsageLineChart component', () => {
    it('renders correctly with empty data array', () => {
      const { toJSON } = render(<UsageLineChart data={[]} testID="chart-empty" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders correctly with a single point and default props', () => {
      const singlePoint = [{ label: 'Lun', value: 15 }];
      const { getByTestId } = render(<UsageLineChart data={singlePoint} testID="chart-single" />);
      expect(getByTestId('chart-single')).toBeTruthy();
    });

    it('renders with multiple points and allows toggling tooltip', () => {
      const data = [
        { label: 'Lun', value: 10, date: '01' },
        { label: 'Mar', value: 25, date: '02', fullDate: '2026-09-02' },
        { label: 'Mie', value: 15, date: '03' },
      ];

      const { getByTestId, queryByTestId } = render(
        <UsageLineChart
          data={data}
          height={200}
          unit="sesiones"
          lineColor="#2E67D1"
          testID="chart-multi"
        />
      );

      expect(getByTestId('chart-multi')).toBeTruthy();

      // Tooltip is initially not visible
      expect(queryByTestId('chart-tooltip')).toBeNull();

      // Click on second point
      const point1 = getByTestId('chart-point-1');
      fireEvent.press(point1);

      // Tooltip is now visible
      expect(getByTestId('chart-tooltip')).toBeTruthy();

      // Clicking point again toggles tooltip off
      fireEvent.press(point1);
      expect(queryByTestId('chart-tooltip')).toBeNull();
    });
  });
});
