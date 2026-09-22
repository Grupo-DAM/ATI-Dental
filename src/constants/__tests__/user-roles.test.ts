import {
  isAdminUser,
  isOdontologoUser,
  getRoleLabelKey,
  USER_ROLES,
  LEGACY_ADMIN_ROLE,
} from '@/constants/user-roles';

describe('user-roles', () => {
  describe('isAdminUser', () => {
    it('detecta admin con rol constante', () => {
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ADMIN })).toBe(true);
    });

    it('acepta rol legacy administrador', () => {
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: LEGACY_ADMIN_ROLE })).toBe(true);
    });

    it('no marca odontólogo como admin', () => {
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ODONTOLOGO })).toBe(false);
    });

    it('retorna false para roles no administrativos (asistente, medico, usuario_externo)', () => {
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ASISTENTE })).toBe(false);
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.MEDICO })).toBe(false);
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.USUARIO_EXTERNO })).toBe(false);
    });

    it('retorna false para roles desconocidos o vacíos', () => {
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: 'super_admin' })).toBe(false);
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: '' })).toBe(false);
    });

    it('maneja valores nulos o indefinidos de usuario de forma segura', () => {
      expect(isAdminUser(null)).toBe(false);
      expect(isAdminUser(undefined)).toBe(false);
      expect(isAdminUser({ uid: '1', email: 'a@test.com', rol: undefined })).toBe(false);
    });
  });

  describe('isOdontologoUser', () => {
    it('detecta rol de odontólogo correctamente', () => {
      expect(isOdontologoUser({ uid: '1', email: 'o@test.com', rol: USER_ROLES.ODONTOLOGO })).toBe(true);
    });

    it('retorna false para otros roles', () => {
      expect(isOdontologoUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ADMIN })).toBe(false);
      expect(isOdontologoUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.ASISTENTE })).toBe(false);
      expect(isOdontologoUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.MEDICO })).toBe(false);
      expect(isOdontologoUser({ uid: '1', email: 'a@test.com', rol: USER_ROLES.USUARIO_EXTERNO })).toBe(false);
    });

    it('maneja valores nulos o indefinidos de usuario de forma segura', () => {
      expect(isOdontologoUser(null)).toBe(false);
      expect(isOdontologoUser(undefined)).toBe(false);
      expect(isOdontologoUser({ uid: '1', email: 'o@test.com', rol: undefined })).toBe(false);
    });
  });

  describe('getRoleLabelKey', () => {
    it('resuelve claves i18n para cada rol definido', () => {
      expect(getRoleLabelKey(USER_ROLES.ODONTOLOGO)).toBe('navigation.roles.odontologo');
      expect(getRoleLabelKey(USER_ROLES.ASISTENTE)).toBe('navigation.roles.asistente');
      expect(getRoleLabelKey(USER_ROLES.ADMIN)).toBe('navigation.roles.admin');
      expect(getRoleLabelKey(LEGACY_ADMIN_ROLE)).toBe('navigation.roles.admin');
      expect(getRoleLabelKey(USER_ROLES.MEDICO)).toBe('navigation.roles.medico');
      expect(getRoleLabelKey(USER_ROLES.USUARIO_EXTERNO)).toBe('navigation.roles.usuarioExterno');
    });

    it('retorna la clave por defecto para roles desconocidos o no definidos', () => {
      expect(getRoleLabelKey(undefined)).toBe('navigation.roles.default');
      expect(getRoleLabelKey('')).toBe('navigation.roles.default');
      expect(getRoleLabelKey('rol_inexistente')).toBe('navigation.roles.default');
    });
  });
});