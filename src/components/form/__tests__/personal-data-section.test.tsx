import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PersonalDataSection } from '../personal-data-section';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PersonalDataSection', () => {
  const commonProps = {
    birthDate: '15/05/1990',
    onOpenDatePicker: jest.fn(),
    gender: 'female',
    genderLabel: 'Femenino',
    onOpenGenderModal: jest.fn(),
    email: 'test@example.com',
    onChangeEmail: jest.fn(),
    phone: '+123456789',
    onChangePhone: jest.fn(),
    onPickPhoto: jest.fn(),
    onRemovePhoto: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('type === "patient"', () => {
    const patientProps = {
      ...commonProps,
      type: 'patient' as const,
      fullName: 'Carlos Gómez',
      onChangeFullName: jest.fn(),
      documentId: '12345678',
      onChangeDocumentId: jest.fn(),
      address: 'Av. Libertador 123',
      onChangeAddress: jest.fn(),
    };

    it('renders all patient fields and title correctly', () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <PersonalDataSection {...patientProps} />
      );

      // Default patient title
      expect(getByText('registerPatient.personalData')).toBeTruthy();

      // Patient specific fields
      expect(getByTestId('input-full-name')).toBeTruthy();
      expect(getByTestId('input-document')).toBeTruthy();
      expect(getByTestId('input-address')).toBeTruthy();

      // Common fields
      expect(getByTestId('select-birth-date')).toBeTruthy();
      expect(getByTestId('select-gender')).toBeTruthy();
      expect(getByTestId('input-phone')).toBeTruthy();
      expect(getByTestId('input-email')).toBeTruthy();

      // Profile / Admin fields should NOT be rendered
      expect(queryByTestId('input-name')).toBeNull();
      expect(queryByTestId('input-lastname')).toBeNull();
      expect(queryByTestId('select-country')).toBeNull();
      expect(queryByTestId('input-bio')).toBeNull();
      expect(queryByTestId('select-user-role')).toBeNull();
      expect(queryByTestId('select-user-status')).toBeNull();
    });

    it('handles input text changes and button interactions', () => {
      const { getByTestId } = render(
        <PersonalDataSection {...patientProps} photoUri="file:///test.jpg" />
      );

      fireEvent.changeText(getByTestId('input-full-name'), 'Nuevo Nombre');
      expect(patientProps.onChangeFullName).toHaveBeenCalledWith('Nuevo Nombre');

      fireEvent.changeText(getByTestId('input-document'), '87654321');
      expect(patientProps.onChangeDocumentId).toHaveBeenCalledWith('87654321');

      fireEvent.changeText(getByTestId('input-address'), 'Calle Nueva 456');
      expect(patientProps.onChangeAddress).toHaveBeenCalledWith('Calle Nueva 456');

      fireEvent.changeText(getByTestId('input-phone'), '+987654321');
      expect(patientProps.onChangePhone).toHaveBeenCalledWith('+987654321');

      fireEvent.changeText(getByTestId('input-email'), 'nuevo@example.com');
      expect(patientProps.onChangeEmail).toHaveBeenCalledWith('nuevo@example.com');

      fireEvent.press(getByTestId('select-birth-date'));
      expect(patientProps.onOpenDatePicker).toHaveBeenCalled();

      fireEvent.press(getByTestId('select-gender'));
      expect(patientProps.onOpenGenderModal).toHaveBeenCalled();

      fireEvent.press(getByTestId('btn-change-photo'));
      expect(patientProps.onPickPhoto).toHaveBeenCalled();

      fireEvent.press(getByTestId('btn-remove-photo'));
      expect(patientProps.onRemovePhoto).toHaveBeenCalled();
    });

    it('renders error messages when passed', () => {
      const { getByText } = render(
        <PersonalDataSection
          {...patientProps}
          fullNameError="Nombre requerido"
          emailError="Correo inválido"
        />
      );

      expect(getByText('Nombre requerido')).toBeTruthy();
      expect(getByText('Correo inválido')).toBeTruthy();
    });
  });

  describe('type === "profile"', () => {
    const profileProps = {
      ...commonProps,
      type: 'profile' as const,
      name: 'Valeria',
      onChangeName: jest.fn(),
      lastName: 'Smith',
      onChangeLastName: jest.fn(),
      country: 'ES',
      countryLabel: 'España',
      onOpenCountryModal: jest.fn(),
      bio: 'Odontóloga especialista',
      onChangeBio: jest.fn(),
    };

    it('renders profile fields and title correctly', () => {
      const { getByTestId, queryByTestId, getByText } = render(
        <PersonalDataSection {...profileProps} />
      );

      // Default profile title
      expect(getByText('profile.personalInfo')).toBeTruthy();

      // Profile specific fields
      expect(getByTestId('input-name')).toBeTruthy();
      expect(getByTestId('input-lastname')).toBeTruthy();
      expect(getByTestId('select-country')).toBeTruthy();
      expect(getByTestId('input-bio')).toBeTruthy();

      // Common fields
      expect(getByTestId('select-birth-date')).toBeTruthy();
      expect(getByTestId('select-gender')).toBeTruthy();
      expect(getByTestId('input-phone')).toBeTruthy();
      expect(getByTestId('input-email')).toBeTruthy();

      // Patient fields should NOT be rendered
      expect(queryByTestId('input-full-name')).toBeNull();
      expect(queryByTestId('input-document')).toBeNull();
      expect(queryByTestId('input-address')).toBeNull();
      expect(queryByTestId('select-user-role')).toBeNull();
      expect(queryByTestId('select-user-status')).toBeNull();
    });

    it('handles profile input changes and country modal trigger', () => {
      const { getByTestId, getByText } = render(
        <PersonalDataSection
          {...profileProps}
          nameError="Nombre inválido"
          lastNameError="Apellido inválido"
        />
      );

      expect(getByText('Nombre inválido')).toBeTruthy();
      expect(getByText('Apellido inválido')).toBeTruthy();

      fireEvent.changeText(getByTestId('input-name'), 'María');
      expect(profileProps.onChangeName).toHaveBeenCalledWith('María');

      fireEvent.changeText(getByTestId('input-lastname'), 'González');
      expect(profileProps.onChangeLastName).toHaveBeenCalledWith('González');

      fireEvent.changeText(getByTestId('input-bio'), 'Cirujana dental');
      expect(profileProps.onChangeBio).toHaveBeenCalledWith('Cirujana dental');

      fireEvent.press(getByTestId('select-country'));
      expect(profileProps.onOpenCountryModal).toHaveBeenCalled();
    });
  });

  describe('type === "admin-user"', () => {
    const adminProps = {
      ...commonProps,
      type: 'admin-user' as const,
      name: 'Admin',
      onChangeName: jest.fn(),
      lastName: 'User',
      onChangeLastName: jest.fn(),
      country: 'VE',
      countryLabel: 'Venezuela',
      onOpenCountryModal: jest.fn(),
      bio: 'Administrador general',
      onChangeBio: jest.fn(),
      role: 'admin',
      roleLabel: 'Administrador',
      onOpenRoleModal: jest.fn(),
      userStatus: true,
      userStatusLabel: 'Activo',
      onOpenStatusModal: jest.fn(),
    };

    it('renders admin-user specific role and status fields', () => {
      const { getByTestId, getByText } = render(
        <PersonalDataSection
          {...adminProps}
          title="Ficha Administrativa"
          photoLabels={{ label: 'Foto Admin', change: 'Elegir', remove: 'Borrar', help: 'Ayuda foto' }}
        />
      );

      // Custom title and photo labels
      expect(getByText('Ficha Administrativa')).toBeTruthy();
      expect(getByText('Foto Admin')).toBeTruthy();
      expect(getByText('Elegir')).toBeTruthy();
      expect(getByText('Borrar')).toBeTruthy();
      expect(getByText('Ayuda foto')).toBeTruthy();

      // Admin specific fields
      expect(getByTestId('select-user-role')).toBeTruthy();
      expect(getByTestId('select-user-status')).toBeTruthy();

      fireEvent.press(getByTestId('select-user-role'));
      expect(adminProps.onOpenRoleModal).toHaveBeenCalled();

      fireEvent.press(getByTestId('select-user-status'));
      expect(adminProps.onOpenStatusModal).toHaveBeenCalled();
    });

    it('displays fallback user status when label not provided', () => {
      const { getByTestId } = render(
        <PersonalDataSection
          {...adminProps}
          title={undefined}
          roleLabel={undefined}
          userStatusLabel={undefined}
          userStatus="inactivo"
          onOpenRoleModal={undefined}
          onOpenStatusModal={undefined}
        />
      );

      expect(getByTestId('select-user-status')).toBeTruthy();
      fireEvent.press(getByTestId('select-user-role'));
      fireEvent.press(getByTestId('select-user-status'));
    });

    it('handles boolean false and empty string for userStatus', () => {
      const { getByTestId } = render(
        <PersonalDataSection
          {...adminProps}
          role=""
          roleLabel=""
          userStatus={false}
          userStatusLabel=""
        />
      );

      expect(getByTestId('select-user-status')).toBeTruthy();
    });

    it('handles country press fallback when onOpenCountryModal is undefined', () => {
      const { getByTestId } = render(
        <PersonalDataSection
          {...adminProps}
          type="profile"
          onOpenCountryModal={undefined}
        />
      );

      fireEvent.press(getByTestId('select-country'));
    });
  });
});

