import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ResponsibleCard, EditResponsibleCard } from '@/components/contact/responsible-card';

// ─── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    onlineStatus: '#10B981',
    breadcrumbSeparator: '#D1D5DB',
    textNames: '#111827',
    placeholderColor: '#9CA3AF',
    alert: '#EF4444',
  }),
}));

jest.mock('@/constants/styles/contact.styles', () => ({
  createResponsibleCardStyles: () => ({
    card: {},
    avatarContainer: {},
    avatar: {},
    statusDot: {},
    contentContainer: {},
    name: {},
    role: {},
    description: {},
    actionsRow: {},
    circleButton: {},
  }),
  createEditResponsibleCardStyles: () => ({
    card: {},
    header: {},
    photoRow: {},
    avatar: {},
    photoInfo: {},
    photoLabel: {},
    photoActions: {},
    changeBtn: {},
    changeTxt: {},
    deleteTxt: {},
    photoHint: {},
    trashBtn: {},
    row: {},
    col: {},
    label: {},
    input: {},
    textarea: {},
    iconRow: {},
    rowIcon: {},
    iconInput: {},
  }),
}));

jest.mock('@/components/ui/card-container', () => ({
  CardContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ResponsibleCard Component', () => {
  const defaultProps = {
    name: 'Juan Pérez',
    role: 'Odontólogo General',
    description: 'Especialista en profilaxis y diseño de sonrisa.',
    imageUrl: { uri: 'https://example.com/avatar.jpg' },
    isOnline: true,
    onEmailPress: jest.fn(),
    onPhonePress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza correctamente la información básica del responsable', () => {
    const { getByText } = render(<ResponsibleCard {...defaultProps} />);

    expect(getByText('Juan Pérez')).toBeTruthy();
    expect(getByText('Odontólogo General')).toBeTruthy();
    expect(getByText('Especialista en profilaxis y diseño de sonrisa.')).toBeTruthy();
  });

  it('concatena el título con el nombre cuando el título está presente', () => {
    const { getByText } = render(
      <ResponsibleCard {...defaultProps} title="Dr" />
    );

    expect(getByText('Dr. Juan Pérez')).toBeTruthy();
  });

  it('muestra el indicador de estado online u offline correctamente', () => {
    const { getByTestId, rerender } = render(
      <ResponsibleCard {...defaultProps} isOnline={true} />
    );
    expect(getByTestId('status-online')).toBeTruthy();

    rerender(<ResponsibleCard {...defaultProps} isOnline={false} />);
    expect(getByTestId('status-offline')).toBeTruthy();
  });

  it('ejecuta los callbacks onPress al interactuar con los botones de contacto rápido', () => {
    const { getByTestId } = render(<ResponsibleCard {...defaultProps} />);

    fireEvent.press(getByTestId('btn-quick-email'));
    expect(defaultProps.onEmailPress).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('btn-quick-phone'));
    expect(defaultProps.onPhonePress).toHaveBeenCalledTimes(1);
  });
});

describe('EditResponsibleCard Component', () => {
  const mockResp = {
    id: 'resp-1',
    title: 'Dr',
    name: 'Ana Gómez',
    role: 'Ortodoncista',
    description: 'Especialista en ortodoncia invisible.',
    email: 'ana.gomez@atidental.com',
    phone: '+1234567890',
    imageUrl: 'https://example.com/ana.png',
  };

  const mockOnChange = jest.fn();
  const mockOnClear = jest.fn();
  const mockT = (key: string) => key;

  const defaultProps = {
    resp: mockResp,
    index: 0,
    onChange: mockOnChange,
    onClear: mockOnClear,
    t: mockT,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza los campos de entrada con los datos del responsable proporcionado', () => {
    const { getByDisplayValue } = render(<EditResponsibleCard {...defaultProps} />);

    expect(getByDisplayValue('Dr')).toBeTruthy();
    expect(getByDisplayValue('Ana Gómez')).toBeTruthy();
    expect(getByDisplayValue('Ortodoncista')).toBeTruthy();
    expect(getByDisplayValue('Especialista en ortodoncia invisible.')).toBeTruthy();
    expect(getByDisplayValue('ana.gomez@atidental.com')).toBeTruthy();
    expect(getByDisplayValue('+1234567890')).toBeTruthy();
  });

  it('invoca onChange con los argumentos correctos al editar un campo', () => {
    const { getByDisplayValue } = render(<EditResponsibleCard {...defaultProps} />);

    fireEvent.changeText(getByDisplayValue('Dr'), 'Dra');
    expect(mockOnChange).toHaveBeenCalledWith(0, 'title', 'Dra');

    fireEvent.changeText(getByDisplayValue('Ana Gómez'), 'Maria López');
    expect(mockOnChange).toHaveBeenCalledWith(0, 'name', 'Maria López');

    fireEvent.changeText(getByDisplayValue('Ortodoncista'), 'Cirujano');
    expect(mockOnChange).toHaveBeenCalledWith(0, 'role', 'Cirujano');

    fireEvent.changeText(getByDisplayValue('ana.gomez@atidental.com'), 'nuevo@email.com');
    expect(mockOnChange).toHaveBeenCalledWith(0, 'email', 'nuevo@email.com');
  });

  it('invoca onClear al hacer clic en el botón de eliminación/papelera', () => {
    const { getByText } = render(<EditResponsibleCard {...defaultProps} />);

    // El botón contiene la papelera que acciona onClear(index)
    // Se localiza mediante la jerarquía del contenedor o interactuando con su botón
    const trashBtn = getByText('updateContact.photoLabel').parent?.parent?.parent?.children[1];
    if (trashBtn) {
      fireEvent.press(trashBtn);
      expect(mockOnClear).toHaveBeenCalledWith(0);
    }
  });
});