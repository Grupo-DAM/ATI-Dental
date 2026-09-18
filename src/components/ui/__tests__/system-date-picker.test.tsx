import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { isSystemDatePickerAvailable, SystemDatePicker } from '@/components/ui/system-date-picker';

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  const Picker = (props: { testID?: string }) => <View testID={props.testID ?? 'native-date-picker'} />;
  return { __esModule: true, default: Picker };
});

describe('SystemDatePicker', () => {
  it('detecta el módulo nativo cuando está disponible', () => {
    expect(isSystemDatePickerAvailable()).toBe(true);
  });

  it('renderiza el picker nativo', () => {
    render(
      <SystemDatePicker
        testID="wrapped-date-picker"
        value={new Date('2000-01-01')}
        mode="date"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('wrapped-date-picker')).toBeTruthy();
  });
});
