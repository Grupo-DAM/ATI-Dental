import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { BirthDatePicker, formatBirthDate } from '@/components/ui/birth-date-picker';

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, View } = require('react-native');
  const Picker = (props: {
    testID?: string;
    onChange?: (event: { type?: string }, date?: Date) => void;
  }) => (
    <View testID={props.testID ?? 'native-date-picker'}>
      <Pressable
        testID="confirm-native-date"
        onPress={() => props.onChange?.({ type: 'set' }, new Date(1991, 6, 4))}
      />
      <Pressable testID="dismiss-native-date" onPress={() => props.onChange?.({ type: 'dismissed' })} />
    </View>
  );
  return { __esModule: true, default: Picker };
});

const baseProps = {
  visible: true,
  value: new Date(2000, 0, 1),
  title: 'Fecha',
  confirmLabel: 'Confirmar',
  pickerTestID: 'shared-birth-date-picker',
  locale: 'es-ES',
};

describe('BirthDatePicker', () => {
  it('formatea la fecha con día y mes de dos dígitos', () => {
    expect(formatBirthDate(new Date(1991, 6, 4))).toBe('04/07/1991');
  });

  it('en Android notifica la fecha y cierra al confirmar', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });

    const onClose = jest.fn();
    const onSelect = jest.fn();
    render(<BirthDatePicker {...baseProps} onClose={onClose} onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId('confirm-native-date'));
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(new Date(1991, 6, 4));

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });

  it('en iOS muestra el modal y confirma sin seleccionar fecha al pulsar el botón', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });

    const onClose = jest.fn();
    render(
      <BirthDatePicker
        {...baseProps}
        modalTestID="shared-birth-date-modal"
        onClose={onClose}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId('shared-birth-date-modal')).toBeTruthy();
    fireEvent.press(screen.getByTestId('btn-confirm-birth-date'));
    expect(onClose).toHaveBeenCalled();

    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
  });
});
