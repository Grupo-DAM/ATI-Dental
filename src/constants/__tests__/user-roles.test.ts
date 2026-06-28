import { isAdminUser, getRoleLabelKey, USER_ROLES } from '@/constants/user-roles';

describe('user-roles', () => {
  it('detecta admin', () => {
    expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ADMIN })).toBe(true);
  });

  it('acepta rol legacy administrador', () => {
    expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: 'administrador' })).toBe(true);
  });

  it('no marca odontólogo como admin', () => {
    expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ODONTOLOGO })).toBe(false);
  });

  it('resuelve claves i18n de rol', () => {
    expect(getRoleLabelKey(USER_ROLES.ODONTOLOGO)).toBe('navigation.roles.odontologo');
    expect(getRoleLabelKey(undefined)).toBe('navigation.roles.default');
  });
});
