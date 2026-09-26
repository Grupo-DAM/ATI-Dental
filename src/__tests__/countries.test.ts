import { getCountryByCode, COUNTRIES } from '@/constants/countries';

describe('countries', () => {
  it('getCountryByCode retorna el país correcto para un código válido', () => {
    const co = getCountryByCode('co');
    expect(co).toBeDefined();
    expect(co?.name).toBe('Colombia');
    expect(co?.flag).toBe('🇨🇴');
    expect(co?.region).toBe('andina');
  });

  it('getCountryByCode retorna undefined para un código inexistente', () => {
    const result = getCountryByCode('zz');
    expect(result).toBeUndefined();
  });

  it('getCountryByCode retorna undefined para una cadena vacía', () => {
    const result = getCountryByCode('');
    expect(result).toBeUndefined();
  });

  it('COUNTRIES está ordenado alfabéticamente con "other" al final', () => {
    const lastCountry = COUNTRIES[COUNTRIES.length - 1];
    expect(lastCountry.code).toBe('other');

    // Verificar que los demás están ordenados
    for (let i = 1; i < COUNTRIES.length - 1; i++) {
      expect(COUNTRIES[i - 1].name.localeCompare(COUNTRIES[i].name)).toBeLessThanOrEqual(0);
    }
  });
});
