import { createGlobalStyles } from '@/constants/styles/global.styles';
import { createConsultationRecordStyles } from '@/constants/styles/patients/consultation-record.styles';
import { Colors } from '@/constants/theme';

describe('Styles suites', () => {
  it('creates global styles for light and dark themes', () => {
    const lightGlobal = createGlobalStyles(Colors.light as any);
    const darkGlobal = createGlobalStyles(Colors.dark as any);

    expect(lightGlobal.container.backgroundColor).toBe(Colors.light.background);
    expect(darkGlobal.container.backgroundColor).toBe(Colors.dark.background);
    expect(lightGlobal.buttonPrimary.backgroundColor).toBe(Colors.light.main);
    expect(darkGlobal.buttonPrimary.backgroundColor).toBe(Colors.dark.main);
  });

  it('creates consultation record styles for light and dark themes', () => {
    const lightStyles = createConsultationRecordStyles(Colors.light as any);
    const darkStyles = createConsultationRecordStyles(Colors.dark as any);

    expect(lightStyles.container.backgroundColor).toBe(Colors.light.background);
    expect(darkStyles.container.backgroundColor).toBe(Colors.dark.background);
    expect(lightStyles.btnSubmit.backgroundColor).toBe(Colors.light.main);
    expect(darkStyles.btnSubmit.backgroundColor).toBe(Colors.dark.main);
  });
});
