import React from 'react';

type SystemDatePickerProps = {
  testID?: string;
  value: Date;
  mode: 'date';
  display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'compact' | 'inline';
  maximumDate?: Date;
  minimumDate?: Date;
  locale?: string;
  onChange: (event: { type?: string }, date?: Date) => void;
};

function loadNativePicker() {
  try {
    const nativeModule = require('@react-native-community/datetimepicker');
    return nativeModule?.default ?? nativeModule ?? null;
  } catch {
    return null;
  }
}

export function isSystemDatePickerAvailable(): boolean {
  return loadNativePicker() != null;
}

export function SystemDatePicker(props: Readonly<SystemDatePickerProps>) {
  const DateTimePicker = loadNativePicker();
  if (!DateTimePicker) {
    return null;
  }
  return <DateTimePicker {...props} />;
}
