import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterTreatmentScreen from '../app/(tabs)/register-treatment';

// Mock de @expo/vector-icons para evitar advertencias de act(...) por carga asíncrona de fuentes
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// ========================================================
// SUITE DE TESTS UNITARIOS
// ========================================================
describe('RegisterTreatmentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el título principal y subtítulo', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('registerTreatment.title')).toBeTruthy();
    expect(getByText('registerTreatment.subtitle')).toBeTruthy();
  });

  it('debe renderizar el breadcrumb con los tres niveles', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('registerTreatment.breadcrumb.patients')).toBeTruthy();
    expect(getByText('registerTreatment.breadcrumb.patientRecord')).toBeTruthy();
    expect(getByText('registerTreatment.breadcrumb.treatment')).toBeTruthy();
  });

  it('debe renderizar la tarjeta de información del paciente', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('Mariana López Rivera')).toBeTruthy();
    expect(getByText(/V-12\.345\.678/)).toBeTruthy();
  });

  it('debe renderizar las secciones del formulario', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('registerTreatment.sections.treatmentDetails')).toBeTruthy();
    expect(getByText('registerTreatment.sections.pendingExams')).toBeTruthy();
    expect(getByText('registerTreatment.sections.clinicalInfo')).toBeTruthy();
    expect(getByText('registerTreatment.sections.observationsAndCost')).toBeTruthy();
  });

  it('debe renderizar los botones de cancelar y guardar', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('registerTreatment.cancel')).toBeTruthy();
    expect(getByText('registerTreatment.save')).toBeTruthy();
  });

  it('debe navegar hacia atrás al presionar cancelar', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<RegisterTreatmentScreen />);

    const cancelBtn = getByText('registerTreatment.cancel');
    fireEvent.press(cancelBtn);

    expect(router.back).toHaveBeenCalled();
  });

  it('debe mostrar el modal de confirmación al presionar guardar', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    const saveBtn = getByText('registerTreatment.save');
    fireEvent.press(saveBtn);

    expect(getByText('registerTreatment.modal.title')).toBeTruthy();
    expect(getByText('registerTreatment.modal.message')).toBeTruthy();
  });

  it('debe cerrar el modal al presionar cancelar en el modal', () => {
    const { getByText, queryByText } = render(<RegisterTreatmentScreen />);

    // Open confirmation modal
    fireEvent.press(getByText('registerTreatment.save'));
    expect(getByText('registerTreatment.modal.title')).toBeTruthy();

    // Cancel the modal
    fireEvent.press(getByText('registerTreatment.modal.cancel'));

    expect(queryByText('registerTreatment.modal.title')).toBeFalsy();
  });

  it('debe mostrar un toast de éxito al confirmar guardado', async () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    // Open confirmation modal
    fireEvent.press(getByText('registerTreatment.save'));

    // Confirm save
    fireEvent.press(getByText('registerTreatment.modal.confirm'));

    await waitFor(() => {
      expect(getByText('registerTreatment.toast.title')).toBeTruthy();
      expect(getByText('registerTreatment.toast.message')).toBeTruthy();
    });
  });

  it('debe permitir escribir en el campo de nombre del tratamiento', () => {
    const { getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    const treatmentNameInput = getByPlaceholderText('registerTreatment.placeholders.treatmentName');
    fireEvent.changeText(treatmentNameInput, 'Limpieza profunda');

    expect(treatmentNameInput.props.value).toBe('Limpieza profunda');
  });

  it('debe permitir escribir notas y observaciones', () => {
    const { getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    const notesInput = getByPlaceholderText('registerTreatment.placeholders.notes');
    fireEvent.changeText(notesInput, 'Paciente alérgico a la penicilina');

    expect(notesInput.props.value).toBe('Paciente alérgico a la penicilina');
  });

  it('debe permitir escribir el costo estimado', () => {
    const { getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    const costInput = getByPlaceholderText('0.00');
    fireEvent.changeText(costInput, '150.00');

    expect(costInput.props.value).toBe('150.00');
  });

  it('debe abrir y seleccionar una opción del dropdown de categoría', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    // Open the dropdown
    const categoryTrigger = getByText('registerTreatment.placeholders.category');
    fireEvent.press(categoryTrigger);

    // Select an option
    const option = getByText('Ortodoncia');
    fireEvent.press(option);

    // The selected value should now be visible
    expect(getByText('Ortodoncia')).toBeTruthy();
  });

  it('debe agregar un examen pendiente cuando se presiona agregar', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    const examNameInput = getByPlaceholderText('registerTreatment.placeholders.examName');
    fireEvent.changeText(examNameInput, 'Radiografía panorámica');

    const addBtn = getByText('registerTreatment.addExam');
    fireEvent.press(addBtn);

    expect(getByText('Radiografía panorámica')).toBeTruthy();
  });

  it('no debe agregar un examen si el campo de nombre está vacío', () => {
    const { getByText, queryByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    // Ensure exam name input is empty
    const examNameInput = getByPlaceholderText('registerTreatment.placeholders.examName');
    fireEvent.changeText(examNameInput, '');

    const addBtn = getByText('registerTreatment.addExam');
    fireEvent.press(addBtn);

    // Only the add button text should exist, no exam items
    expect(queryByText('close-circle')).toBeFalsy();
  });

  it('debe eliminar un examen pendiente al presionar el botón de eliminar', () => {
    const { getByText, queryByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

    // Add an exam first
    const examNameInput = getByPlaceholderText('registerTreatment.placeholders.examName');
    fireEvent.changeText(examNameInput, 'TAC dental');

    const addBtn = getByText('registerTreatment.addExam');
    fireEvent.press(addBtn);
    expect(getByText('TAC dental')).toBeTruthy();

    // Remove the exam
    const removeBtn = getByText('close-circle');
    fireEvent.press(removeBtn);

    expect(queryByText('TAC dental')).toBeFalsy();
  });

  it('debe seleccionar una pieza dental desde el dropdown', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    // Open the dental piece dropdown
    const dentalPieceTrigger = getByText('registerTreatment.placeholders.dentalPiece');
    fireEvent.press(dentalPieceTrigger);

    // Select a dental piece
    const option = getByText('Pieza 11');
    fireEvent.press(option);

    expect(getByText('Pieza 11')).toBeTruthy();
  });

  it('debe seleccionar un dentista responsable desde el dropdown', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    const dentistTrigger = getByText('registerTreatment.placeholders.responsibleDentist');
    fireEvent.press(dentistTrigger);

    const option = getByText('Dra. García');
    fireEvent.press(option);

    expect(getByText('Dra. García')).toBeTruthy();
  });

  it('debe seleccionar un estado desde el dropdown', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    const statusTrigger = getByText('registerTreatment.placeholders.status');
    fireEvent.press(statusTrigger);

    const option = getByText('En Progreso');
    fireEvent.press(option);

    expect(getByText('En Progreso')).toBeTruthy();
  });
});
