import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import UpdateContactInfoScreen, {
  EMAIL_REGEX,
  PHONE_REGEX,
  validate,
} from '../app/(tabs)/update-contact-info';

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock de expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock de i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock de hooks propios
const mockUser = { uid: 'admin-123', rol: 'ADMIN' };
let mockAuthLoading = false;
let mockCurrentUser: typeof mockUser | null = mockUser;

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    loading: mockAuthLoading,
  }),
}));

jest.mock('@/constants/user-roles', () => ({
  isAdminUser: (user: any) => user?.rol === 'ADMIN',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#000',
    emailContactColor: 'red',
    phoneContactColor: 'green',
    whatsAppContactColor: 'blue',
  }),
}));

jest.mock('@/constants/styles/contact.styles', () => ({
  createUpdateContactInfoStyles: () => ({
    container: {},
    centered: {},
    loadingText: {},
    sectionHeaderRow: {},
    sectionTitle: {},
    sectionContainer: {},
    emptyBox: {},
    emptyText: {},
    card: {},
    buttonRow: {},
    btn: {},
    btnCancel: {},
    btnCancelText: {},
    btnSave: {},
    btnDisabled: {},
    btnSaveText: {},
  }),
}));

// Mocks de Componentes Hijas
jest.mock('@/components/app-header', () => ({
  AppHeader: 'AppHeader',
}));
jest.mock('@/components/breadcrumb', () => ({
  Breadcrumb: 'Breadcrumb',
}));
jest.mock('@/components/page-title-layout', () => ({
  PageTitleLayout: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/ui/card-container', () => ({
  CardContainer: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/components/contact/responsible-card', () => ({
  EditResponsibleCard: ({ resp, index, onChange, onClear }: any) => {
    const React = require('react');
    const { View, Text, Button } = require('react-native');
    return (
      <View testID={`responsible-card-${index}`}>
        <Text>{resp.name}</Text>
        <Button
          testID={`change-resp-name-${index}`}
          title="Change Name"
          onPress={() => onChange(index, 'name', 'Nuevo Nombre')}
        />
        <Button
          testID={`clear-resp-${index}`}
          title="Clear Resp"
          onPress={() => onClear(index)}
        />
      </View>
    );
  },
}));
jest.mock('@/components/contact/form-field', () => ({
  FormField: ({ testID, value, onChangeText, error }: any) => {
    const React = require('react');
    const { TextInput, Text, View } = require('react-native');
    return (
      <View>
        <TextInput testID={testID} value={value} onChangeText={onChangeText} />
        {error && <Text testID={`${testID}-error`}>{error}</Text>}
      </View>
    );
  },
}));

// Mock de Firebase Firestore
const mockBatchCommit = jest.fn().mockResolvedValue(true);
const mockBatchSet = jest.fn();
const mockBatch = jest.fn(() => ({
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

let contactSnapshotCallback: any = null;
let contactErrorCallback: any = null;
let responsiblesSnapshotCallback: any = null;
let responsiblesErrorCallback: any = null;

const mockUnsubContact = jest.fn();
const mockUnsubResponsibles = jest.fn();

jest.mock('@/config/firebase', () => ({
  firestore: jest.fn(() => ({
    collection: (collName: string) => {
      if (collName === 'configuracion') {
        return {
          doc: () => ({
            onSnapshot: (cb: any, errCb: any) => {
              contactSnapshotCallback = cb;
              contactErrorCallback = errCb;
              return mockUnsubContact;
            },
          }),
        };
      }
      if (collName === 'responsibles') {
        return {
          doc: (id: string) => ({ id }),
          onSnapshot: (cb: any, errCb: any) => {
            responsiblesSnapshotCallback = cb;
            responsiblesErrorCallback = errCb;
            return mockUnsubResponsibles;
          },
        };
      }
      return {};
    },
    batch: mockBatch,
  })),
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('update-contact-info validation logic', () => {
  const mockTranslate = (key: string) => key;

  describe('EMAIL_REGEX', () => {
    it('accepts valid email addresses', () => {
      expect(EMAIL_REGEX.test('dr.nuevo@atidental.com')).toBe(true);
      expect(EMAIL_REGEX.test('usuario@dominio.co')).toBe(true);
      expect(EMAIL_REGEX.test('nombre.apellido@clinica.es')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(EMAIL_REGEX.test('')).toBe(false);
      expect(EMAIL_REGEX.test('correo_sin_arroba')).toBe(false);
      expect(EMAIL_REGEX.test('@dominio.com')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@dominio')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@@dominio.com')).toBe(false);
    });
  });

  describe('PHONE_REGEX', () => {
    it('accepts valid phone numbers', () => {
      expect(PHONE_REGEX.test('+1234567890')).toBe(true);
      expect(PHONE_REGEX.test('1234567890')).toBe(true);
      expect(PHONE_REGEX.test('+58 412 1234567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(PHONE_REGEX.test('')).toBe(false);
      expect(PHONE_REGEX.test('123')).toBe(false);
      expect(PHONE_REGEX.test('abc')).toBe(false);
    });
  });

  describe('validate form function', () => {
    it('returns no errors for a valid form', () => {
      const validForm = {
        email: 'contacto@atidental.com',
        telefono: '+1234567890',
        whatsapp: '+1234567890',
      };
      const errors = validate(validForm, mockTranslate);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns error keys when fields are invalid or empty', () => {
      const invalidForm = {
        email: 'invalido',
        telefono: '12',
        whatsapp: '   ',
      };
      const errors = validate(invalidForm, mockTranslate);
      expect(errors.email).toBe('updateContact.validation.invalidEmail');
      expect(errors.telefono).toBe('updateContact.validation.invalidPhone');
      expect(errors.whatsapp).toBe('updateContact.validation.emptyWhatsapp');
    });
  });
});

describe('UpdateContactInfoScreen Component', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthLoading = false;
    mockCurrentUser = mockUser;
  });

  it('muestra el loader mientras la autenticación se está procesando', () => {
    mockAuthLoading = true;
    const { getByText } = render(<UpdateContactInfoScreen />);
    expect(getByText('updateContact.loading')).toBeTruthy();
  });

  it('redirecciona a home si no existe un usuario autenticado', () => {
    mockCurrentUser = null;
    render(<UpdateContactInfoScreen />);
    expect(alertSpy).toHaveBeenCalledWith('updateContact.sessionRequired', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('redirecciona a home si el usuario no tiene rol de ADMIN', () => {
    mockCurrentUser = { uid: 'user-1', rol: 'USER' };
    render(<UpdateContactInfoScreen />);
    expect(alertSpy).toHaveBeenCalledWith('updateContact.accessDenied', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('carga datos desde los snapshots de Firestore correctamente', async () => {
    const { getByTestId, queryByText } = render(<UpdateContactInfoScreen />);

    // Emitir datos de contacto
    act(() => {
      contactSnapshotCallback({
        exists: () => true,
        data: () => ({
          email: 'contacto@test.com',
          telefono: '+123456789',
          whatsapp: '+987654321',
        }),
      });
    });

    // Emitir datos de responsables
    act(() => {
      responsiblesSnapshotCallback({
        docs: [
          {
            id: 'resp-1',
            data: () => ({ name: 'Dr. John Doe', title: 'Director' }),
          },
        ],
      });
    });

    await waitFor(() => {
      expect(queryByText('updateContact.loading')).toBeNull();
    });

    expect(getByTestId('input-email').props.value).toBe('contacto@test.com');
    expect(getByTestId('input-telefono').props.value).toBe('+123456789');
    expect(getByTestId('input-whatsapp').props.value).toBe('+987654321');
  });

  it('maneja errores en los listeners de Firestore', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<UpdateContactInfoScreen />);

    act(() => {
      contactErrorCallback(new Error('Contact error'));
      responsiblesErrorCallback(new Error('Responsibles error'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('updateContact.errorLoadTitle', 'updateContact.errorLoad');
    });

    consoleSpy.mockRestore();
  });

  it('permite cambiar los valores del formulario y limpiar errores al escribir', async () => {
    const { getByTestId } = render(<UpdateContactInfoScreen />);

    act(() => {
      contactSnapshotCallback({ exists: () => false });
      responsiblesSnapshotCallback({ docs: [] });
    });

    const emailInput = getByTestId('input-email');

    // Provocar error al intentar guardar con campos vacíos
    fireEvent.press(getByTestId('btn-save'));
    await waitFor(() => {
      expect(getByTestId('input-email-error')).toBeTruthy();
    });

    // Cambiar texto y verificar que el error se limpia
    fireEvent.changeText(emailInput, 'nuevo@email.com');
    expect(getByTestId('input-email').props.value).toBe('nuevo@email.com');
    expect(emailInput.props.error).toBeUndefined();
  });

  it('permite modificar y limpiar un responsable', async () => {
    const { getByTestId, getByText } = render(<UpdateContactInfoScreen />);

    act(() => {
      contactSnapshotCallback({ exists: () => false });
      responsiblesSnapshotCallback({
        docs: [
          {
            id: 'resp-1',
            data: () => ({ name: 'Dr. Jane', imageUrl: 'http://img.png' }),
          },
        ],
      });
    });

    // Cambiar campo del responsable
    fireEvent.press(getByTestId('change-resp-name-0'));
    expect(getByText('Nuevo Nombre')).toBeTruthy();

    // Limpiar responsable
    fireEvent.press(getByTestId('clear-resp-0'));
    expect(getByText('')).toBeTruthy();
  });

  it('restaura el formulario a su estado original al presionar el botón Cancelar', async () => {
    const { getByTestId } = render(<UpdateContactInfoScreen />);

    act(() => {
      contactSnapshotCallback({
        exists: () => true,
        data: () => ({ email: 'original@test.com', telefono: '+11111111', whatsapp: '+22222222' }),
      });
      responsiblesSnapshotCallback({ docs: [] });
    });

    // Editar campo
    fireEvent.changeText(getByTestId('input-email'), 'editado@test.com');
    expect(getByTestId('input-email').props.value).toBe('editado@test.com');

    // Cancelar
    fireEvent.press(getByTestId('btn-cancel'));
    expect(getByTestId('input-email').props.value).toBe('original@test.com');
  });

  it('guarda los cambios correctamente con batch.commit() al enviar un formulario válido', async () => {
    const { getByTestId } = render(<UpdateContactInfoScreen />);

    act(() => {
      contactSnapshotCallback({
        exists: () => true,
        data: () => ({ email: 'mail@valid.com', telefono: '+1234567890', whatsapp: '+1234567890' }),
      });
      responsiblesSnapshotCallback({
        docs: [{ id: 'resp-1', data: () => ({ name: 'Doctor' }) }],
      });
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save'));
    });

    expect(mockBatchSet).toHaveBeenCalled();
    expect(mockBatchCommit).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('updateContact.successTitle', 'updateContact.successMessage');
  });

  it('muestra una alerta de error si falla el guardado en Firestore', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockBatchCommit.mockRejectedValueOnce(new Error('Save Error'));

    const { getByTestId } = render(<UpdateContactInfoScreen />);

    act(() => {
      contactSnapshotCallback({
        exists: () => true,
        data: () => ({ email: 'mail@valid.com', telefono: '+1234567890', whatsapp: '+1234567890' }),
      });
      responsiblesSnapshotCallback({ docs: [] });
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-save'));
    });

    expect(alertSpy).toHaveBeenCalledWith('updateContact.errorSaveTitle', 'updateContact.errorSave');
    consoleSpy.mockRestore();
  });
});