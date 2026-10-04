import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { CreateElementModal } from '../create-element-modal';
import {
  ALL_CREATABLE_ELEMENTS,
  getCreatableOptionsForRole,
  isRoleAllowedToCreate,
} from '@/constants/create-element-options';

let mockUser: any = { rol: 'administrador', nombre: 'Admin User' };
const mockPush = jest.fn();

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  router: {
    push: mockPush,
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultVal?: string) => defaultVal || key,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFFFFF',
    pageTitle: '#1F2937',
    fieldLabel: '#374151',
    logo: '#5B2D8B',
    main: '#5B2D8B',
    accentBackground: '#F3E8FF',
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('CreateElementModal Suite (US-39 / Issue #184)', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectOption = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { rol: 'administrador', nombre: 'Admin User' };
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('Escenario 1: Despliegue del menú modal y filtrado de opciones por rol', () => {
    it('muestra las 6 opciones completas cuando el rol es Administrador', () => {
      mockUser = { rol: 'administrador' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('create-opt-patient')).toBeTruthy();
      expect(screen.getByTestId('create-opt-appointment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-consultation')).toBeTruthy();
      expect(screen.getByTestId('create-opt-treatment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-odontogram')).toBeTruthy();
      expect(screen.getByTestId('create-opt-user')).toBeTruthy();
    });

    it('también muestra las 6 opciones cuando el rol es admin (variante estándar)', () => {
      mockUser = { rol: 'admin' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('create-opt-patient')).toBeTruthy();
      expect(screen.getByTestId('create-opt-appointment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-consultation')).toBeTruthy();
      expect(screen.getByTestId('create-opt-treatment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-odontogram')).toBeTruthy();
      expect(screen.getByTestId('create-opt-user')).toBeTruthy();
    });

    it('muestra únicamente 5 opciones para Odontólogo (excluyendo Usuarios)', () => {
      mockUser = { rol: 'odontologo' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('create-opt-patient')).toBeTruthy();
      expect(screen.getByTestId('create-opt-appointment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-consultation')).toBeTruthy();
      expect(screen.getByTestId('create-opt-treatment')).toBeTruthy();
      expect(screen.getByTestId('create-opt-odontogram')).toBeTruthy();
      expect(screen.queryByTestId('create-opt-user')).toBeNull();
    });

    it('muestra únicamente 2 opciones para Asistente (Pacientes y Citas)', () => {
      mockUser = { rol: 'asistente' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('create-opt-patient')).toBeTruthy();
      expect(screen.getByTestId('create-opt-appointment')).toBeTruthy();
      expect(screen.queryByTestId('create-opt-consultation')).toBeNull();
      expect(screen.queryByTestId('create-opt-treatment')).toBeNull();
      expect(screen.queryByTestId('create-opt-odontogram')).toBeNull();
      expect(screen.queryByTestId('create-opt-user')).toBeNull();
    });
  });

  describe('Escenario 2: Selección y redirección al formulario correspondiente', () => {
    it('cierra el modal y redirige a register-patient al seleccionar Paciente', () => {
      mockUser = { rol: 'odontologo' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-patient'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('patients/register-patient');
    });

    it('cierra el modal y redirige a schedule-appointment al seleccionar Cita', () => {
      mockUser = { rol: 'asistente' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-appointment'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('patients/schedule-appointment');
    });

    it('cierra el modal y redirige a clinical-history con tab consultas al seleccionar Consulta', () => {
      mockUser = { rol: 'odontologo' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-consultation'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: 'patients/clinical-history',
        params: { tab: 'consultas', patientId: 'demo-patient' },
      });
    });

    it('cierra el modal y redirige a register-treatment al seleccionar Tratamiento', () => {
      mockUser = { rol: 'odontologo' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-treatment'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('patients/register-treatment');
    });

    it('cierra el modal y redirige a clinical-history con tab odontograma al seleccionar Odontograma', () => {
      mockUser = { rol: 'odontologo' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-odontogram'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: 'patients/clinical-history',
        params: { tab: 'odontograma', patientId: 'demo-patient' },
      });
    });

    it('cierra el modal y redirige a admin/users al seleccionar Usuario siendo Administrador', () => {
      mockUser = { rol: 'admin' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      fireEvent.press(screen.getByTestId('create-opt-user'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('admin/users');
    });

    it('ejecuta onSelectOption personalizado si es provisto como prop', () => {
      mockUser = { rol: 'admin' };
      render(
        <CreateElementModal
          visible={true}
          onClose={mockOnClose}
          onSelectOption={mockOnSelectOption}
        />
      );

      fireEvent.press(screen.getByTestId('create-opt-patient'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSelectOption).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'patient', route: 'patients/register-patient' })
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Escenario 3: Cierre implícito o cancelación del modal', () => {
    it('no renderiza contenido si visible es false', () => {
      render(<CreateElementModal visible={false} onClose={mockOnClose} />);
      expect(screen.queryByTestId('create-opt-patient')).toBeNull();
    });

    it('llama a onClose al presionar sobre el overlay exterior', () => {
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      const overlay = screen.getByTestId('modal-option-overlay');
      fireEvent.press(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Escenario 4: Intentos de acceso no autorizados', () => {
    it('bloquea la navegación y muestra Alert si un Asistente intenta acceder a crear Usuario', () => {
      mockUser = { rol: 'asistente' };
      render(<CreateElementModal visible={true} onClose={mockOnClose} />);

      expect(isRoleAllowedToCreate('asistente', 'user')).toBe(false);
      expect(isRoleAllowedToCreate('asistente', 'odontogram')).toBe(false);
      expect(isRoleAllowedToCreate('asistente', 'treatment')).toBe(false);
      expect(isRoleAllowedToCreate('asistente', 'consultation')).toBe(false);
      expect(isRoleAllowedToCreate('asistente', 'patient')).toBe(true);
      expect(isRoleAllowedToCreate('asistente', 'appointment')).toBe(true);
    });

    it('valida permisos correctamente con getCreatableOptionsForRole y helper isRoleAllowedToCreate', () => {
      expect(ALL_CREATABLE_ELEMENTS).toHaveLength(6);
      expect(getCreatableOptionsForRole('admin')).toHaveLength(6);
      expect(getCreatableOptionsForRole('odontologo')).toHaveLength(5);
      expect(getCreatableOptionsForRole('asistente')).toHaveLength(2);
      expect(isRoleAllowedToCreate('odontologo', 'user')).toBe(false);
      expect(isRoleAllowedToCreate('odontologo', 'odontogram')).toBe(true);
      expect(isRoleAllowedToCreate('admin', 'user')).toBe(true);
      expect(isRoleAllowedToCreate(undefined, 'patient')).toBe(false);
    });
  });

  describe('Escenario 5: Navegación contextual de retorno tras la creación', () => {
    it('asegura que onClose es invocado antes o junto con la navegación para evitar modales residuales', () => {
      const callOrder: string[] = [];
      const trackingClose = jest.fn(() => callOrder.push('close'));
      const trackingSelect = jest.fn(() => callOrder.push('select'));

      render(
        <CreateElementModal
          visible={true}
          onClose={trackingClose}
          onSelectOption={trackingSelect}
        />
      );

      fireEvent.press(screen.getByTestId('create-opt-patient'));

      expect(callOrder).toEqual(['close', 'select']);
    });
  });
});
