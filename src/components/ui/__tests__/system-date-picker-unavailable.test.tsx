describe('SystemDatePicker sin módulo nativo', () => {
  it('devuelve null si require falla', () => {
    jest.isolateModules(() => {
      jest.doMock('@react-native-community/datetimepicker', () => {
        throw new Error('missing native module');
      });
      const {
        isSystemDatePickerAvailable,
        SystemDatePicker,
      } = require('@/components/ui/system-date-picker');

      expect(isSystemDatePickerAvailable()).toBe(false);
      expect(
        SystemDatePicker({
          value: new Date('2000-01-01'),
          mode: 'date',
          onChange: jest.fn(),
        }),
      ).toBeNull();
    });
  });

  it('usa el export CJS si no hay default', () => {
    jest.isolateModules(() => {
      const picker = jest.fn(() => null);
      jest.doMock('@react-native-community/datetimepicker', () => picker);
      const { isSystemDatePickerAvailable, SystemDatePicker } = require('@/components/ui/system-date-picker');

      expect(isSystemDatePickerAvailable()).toBe(true);
      const element = SystemDatePicker({
        value: new Date('2000-01-01'),
        mode: 'date',
        onChange: jest.fn(),
      });
      expect(element?.type).toBe(picker);
    });
  });

  it('trata un módulo undefined como no disponible', () => {
    jest.isolateModules(() => {
      jest.doMock('@react-native-community/datetimepicker', () => undefined);
      const { isSystemDatePickerAvailable } = require('@/components/ui/system-date-picker');
      expect(isSystemDatePickerAvailable()).toBe(false);
    });
  });
});
