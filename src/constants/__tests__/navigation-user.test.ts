import { getNavigationDisplayName } from '@/constants/navigation-user';

describe('getNavigationDisplayName', () => {
  it('prioriza el nombre', () => {
    expect(
      getNavigationDisplayName(
        { nombre: '  Ana  ', alias: 'alias', email: 'ana@test.com' },
        'Usuario',
      ),
    ).toBe('Ana');
  });

  it('usa alias si no hay nombre', () => {
    expect(getNavigationDisplayName({ alias: '  nico  ', email: 'n@test.com' }, 'Usuario')).toBe(
      'nico',
    );
  });

  it('usa la parte local del email si no hay nombre ni alias', () => {
    expect(getNavigationDisplayName({ email: 'doc@test.com' }, 'Usuario')).toBe('doc');
  });

  it('usa el fallback si no hay datos', () => {
    expect(getNavigationDisplayName(null, 'Usuario')).toBe('Usuario');
    expect(getNavigationDisplayName({ nombre: '   ' }, 'Usuario')).toBe('Usuario');
  });
});
