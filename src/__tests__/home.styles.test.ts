import { createStyles } from '@/constants/styles/home.styles';
import { Colors } from '@/constants/theme';

describe('home.styles', () => {
  it('genera estilos correctamente en tema claro', () => {
    const styles = createStyles(Colors.light);
    expect(styles).toBeDefined();
    expect(styles.screen).toBeDefined();
    expect(styles.metricCardGreen).toBeDefined();
    expect(styles.metricCardOrange).toBeDefined();
    expect(styles.metricCardBlue).toBeDefined();
  });

  it('genera estilos correctamente en tema oscuro', () => {
    const styles = createStyles(Colors.dark);
    expect(styles).toBeDefined();
    expect(styles.screen).toBeDefined();
    expect(styles.metricCardGreen).toBeDefined();
    expect(styles.metricCardOrange).toBeDefined();
    expect(styles.metricCardBlue).toBeDefined();
  });
});
