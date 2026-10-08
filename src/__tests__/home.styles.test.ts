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

  it('encoge el texto de las tarjetas para que no desborde la fila', () => {
    const styles = createStyles(Colors.light);
    expect(styles.metricCard.minWidth).toBe(0);
    expect(styles.metricsTopRow.flexDirection).toBe('row');
    expect(styles.metricCardWide.width).toBe('100%');
    expect(styles.metricLabel.flexShrink).toBe(1);
    expect(styles.notificationTextCol).toEqual(expect.objectContaining({
      flexShrink: 1,
      flexWrap: 'wrap',
      minWidth: 0,
    }));
    expect(styles.greetingTextContainer.flexShrink).toBe(1);
    expect(styles.searchResultTextCol.flexShrink).toBe(1);
    expect(styles.quickAccessLabel.flexShrink).toBe(1);
  });
});
