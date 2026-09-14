import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import { UserStatusModal } from '@/components/users-list/user-status-modal';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    border: '#E5E7EB',
    backgroundElement: '#FFFFFF',
    text: '#141018',
    textSecondary: '#4B5563',
    main: '#5B2D8B',
    error: '#BA1A1A',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (typeof options === 'string') return options;
      if (options && typeof options === 'object') {
        if (typeof options.defaultValue === 'string') {
          return options.defaultValue.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => options[k] || '');
        }
      }
      return key;
    },
  }),
}));

describe('UserStatusModal Component', () => {
  const mockConfirm = jest.fn();
  const mockCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders activation modal correctly with user details', () => {
    const { getByTestId, getByText } = render(
      <UserStatusModal
        visible={true}
        userName="Dr. Roberto Méndez"
        targetStatus="activo"
        loading={false}
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );

    expect(getByTestId('modal-status-title')).toBeTruthy();
    expect(getByText('Activar usuario')).toBeTruthy();
    expect(
      getByText('¿Estás seguro de que deseas activar a Dr. Roberto Méndez? Tendrá acceso al sistema administrativo.')
    ).toBeTruthy();
    expect(getByText('Activar')).toBeTruthy();
    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('renders deactivation modal correctly with user details', () => {
    const { getByTestId, getByText } = render(
      <UserStatusModal
        visible={true}
        userName="Dra. Ana Rojas"
        targetStatus="inactivo"
        loading={false}
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );

    expect(getByTestId('modal-status-title')).toBeTruthy();
    expect(getByText('Desactivar usuario')).toBeTruthy();
    expect(
      getByText('¿Estás seguro de que deseas desactivar a Dra. Ana Rojas? Se revocarán sus accesos al sistema administrativo.')
    ).toBeTruthy();
    expect(getByText('Desactivar')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const { getByTestId } = render(
      <UserStatusModal
        visible={true}
        userName="Carlos Sánchez"
        targetStatus="activo"
        loading={false}
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );

    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByTestId } = render(
      <UserStatusModal
        visible={true}
        userName="Carlos Sánchez"
        targetStatus="activo"
        loading={false}
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );

    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it('renders loading indicator and disables actions when loading is true', () => {
    const { getByTestId, queryByText } = render(
      <UserStatusModal
        visible={true}
        userName="Carlos Sánchez"
        targetStatus="activo"
        loading={true}
        onConfirm={mockConfirm}
        onCancel={mockCancel}
      />
    );

    expect(getByTestId('modal-loading-indicator')).toBeTruthy();
    expect(queryByText('Activar')).toBeNull();

    // Verify disabled buttons do not trigger callbacks
    fireEvent.press(getByTestId('modal-confirm-btn'));
    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockCancel).not.toHaveBeenCalled();
  });

  it('matches snapshot for activation mode', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer
        .create(
          <UserStatusModal
            visible={true}
            userName="Dr. Roberto Méndez"
            targetStatus="activo"
            loading={false}
            onConfirm={mockConfirm}
            onCancel={mockCancel}
          />
        )
        .toJSON();
    });
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for deactivation mode', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer
        .create(
          <UserStatusModal
            visible={true}
            userName="Dra. Ana Rojas"
            targetStatus="inactivo"
            loading={false}
            onConfirm={mockConfirm}
            onCancel={mockCancel}
          />
        )
        .toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
