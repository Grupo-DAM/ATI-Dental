import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterTreatmentScreen from '../app/(tabs)/register-treatment';
import * as treatmentService from '@/services/treatment-service';

// Mock de @expo/vector-icons
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

const mockBack = jest.fn();
let mockLocalSearchParams: any = {};

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
  },
  useLocalSearchParams: () => mockLocalSearchParams,
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
// SUITE DE TESTS UNITARIOS - US-10 PERSISTENCIA Y VALIDACIONES
// ========================================================
describe('RegisterTreatmentScreen - Functional & Persistence Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams = {};
  });

  const fillValidForm = (getByPlaceholderText: any, getByText: any) => {
    // Select category
    fireEvent.press(getByText('registerTreatment.placeholders.category'));
    fireEvent.press(getByText('Ortodoncia'));

    // Treatment name
    const nameInput = getByPlaceholderText('registerTreatment.placeholders.treatmentName');
    fireEvent.changeText(nameInput, 'Colocación de brackets');

    // Treatment date
    const dateInput = getByPlaceholderText('10/25/2023');
    fireEvent.changeText(dateInput, '11/01/2023');

    // Dentist
    fireEvent.press(getByText('registerTreatment.placeholders.responsibleDentist'));
    fireEvent.press(getByText('Dra. García'));

    // Status
    fireEvent.press(getByText('registerTreatment.placeholders.status'));
    fireEvent.press(getByText('En Progreso'));

    // Estimated cost
    const costInput = getByPlaceholderText('0.00');
    fireEvent.changeText(costInput, '250.00');
  };

  it('debe asociar los datos del paciente recibidos por parámetros de navegación', () => {
    mockLocalSearchParams = {
      patientId: 'custom-patient-999',
      patientName: 'Carlos Mendoza',
      patientCedula: 'V-98.765.432',
      patientAge: '45',
      patientPhone: '+58 414 111 22 33',
    };

    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('Carlos Mendoza')).toBeTruthy();
    expect(getByText(/V-98\.765\.432/)).toBeTruthy();
  });

  it('debe usar el paciente por defecto cuando no se reciben parámetros de ruta', () => {
    const { getByText } = render(<RegisterTreatmentScreen />);

    expect(getByText('Mariana López Rivera')).toBeTruthy();
    expect(getByText(/V-12\.345\.678/)).toBeTruthy();
  });

  describe('Validaciones de campos obligatorios', () => {
    it('no debe abrir el modal de confirmación si los campos obligatorios están vacíos y debe mostrar errores', () => {
      const { getByText, queryByText } = render(<RegisterTreatmentScreen />);

      const saveBtn = getByText('registerTreatment.save');
      fireEvent.press(saveBtn);

      // El modal no debe aparecer
      expect(queryByText('registerTreatment.modal.title')).toBeFalsy();

      // Deben mostrarse los mensajes de error
      expect(getByText('registerTreatment.errors.categoryRequired')).toBeTruthy();
      expect(getByText('registerTreatment.errors.treatmentNameRequired')).toBeTruthy();
      expect(getByText('registerTreatment.errors.treatmentDateRequired')).toBeTruthy();
      expect(getByText('registerTreatment.errors.dentistRequired')).toBeTruthy();
      expect(getByText('registerTreatment.errors.statusRequired')).toBeTruthy();
      expect(getByText('registerTreatment.errors.costRequired')).toBeTruthy();
    });

    it('debe rechazar costos negativos y mostrar mensaje de error', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      // Set negative cost
      const costInput = getByPlaceholderText('0.00');
      fireEvent.changeText(costInput, '-50.00');

      fireEvent.press(getByText('registerTreatment.save'));

      expect(getByText('registerTreatment.errors.costInvalid')).toBeTruthy();
    });

    it('debe rechazar costos con caracteres no numéricos', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      const costInput = getByPlaceholderText('0.00');
      fireEvent.changeText(costInput, 'cien');

      fireEvent.press(getByText('registerTreatment.save'));

      expect(getByText('registerTreatment.errors.costInvalid')).toBeTruthy();
    });

    it('debe permitir que el campo Pieza Dental permanezca opcional (sin selección específica)', () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      // Dental piece is left untouched
      fireEvent.press(getByText('registerTreatment.save'));

      // El modal debe abrirse sin problemas porque pieza dental es opcional
      expect(getByText('registerTreatment.modal.title')).toBeTruthy();
    });
  });

  describe('Gestión de Exámenes Pendientes', () => {
    it('debe agregar un examen pendiente con nombre y fecha', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

      const examNameInput = getByPlaceholderText('registerTreatment.placeholders.examName');
      fireEvent.changeText(examNameInput, 'Radiografía Panorámica');

      const examDateInput = getByPlaceholderText('dd/mm/yyyy');
      fireEvent.changeText(examDateInput, '20/10/2023');

      fireEvent.press(getByText('registerTreatment.addExam'));

      expect(getByText('Radiografía Panorámica')).toBeTruthy();
      expect(getByText('20/10/2023')).toBeTruthy();
    });

    it('debe mostrar error y no agregar si el nombre del examen está vacío', () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<RegisterTreatmentScreen />);

      const examNameInput = getByPlaceholderText('registerTreatment.placeholders.examName');
      fireEvent.changeText(examNameInput, '   ');

      fireEvent.press(getByText('registerTreatment.addExam'));

      expect(getByText('registerTreatment.errors.examNameRequired')).toBeTruthy();
      expect(queryByText('close-circle')).toBeFalsy();
    });

    it('debe permitir eliminar un examen pendiente previamente agregado', () => {
      const { getByText, getByPlaceholderText, queryByText } = render(<RegisterTreatmentScreen />);

      fireEvent.changeText(
        getByPlaceholderText('registerTreatment.placeholders.examName'),
        'Examen de sangre'
      );
      fireEvent.press(getByText('registerTreatment.addExam'));
      expect(getByText('Examen de sangre')).toBeTruthy();

      // Remove
      fireEvent.press(getByText('close-circle'));
      expect(queryByText('Examen de sangre')).toBeFalsy();
    });
  });

  describe('Confirmación y Persistencia', () => {
    it('NO debe persistir datos si el usuario cancela en el modal de confirmación', () => {
      const createSpy = jest.spyOn(treatmentService, 'createTreatment');
      const { getByText, getByPlaceholderText, queryByText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('registerTreatment.save'));
      expect(getByText('registerTreatment.modal.title')).toBeTruthy();

      // Cancel modal
      fireEvent.press(getByText('registerTreatment.modal.cancel'));
      expect(queryByText('registerTreatment.modal.title')).toBeFalsy();

      expect(createSpy).not.toHaveBeenCalled();
    });

    it('debe persistir el tratamiento asociando al paciente al confirmar en el modal', async () => {
      const createSpy = jest.spyOn(treatmentService, 'createTreatment').mockResolvedValueOnce({
        id: 'new-treatment-id-123',
        patientId: 'patient-mariana-lopez-123',
        category: 'Ortodoncia',
        treatmentName: 'Colocación de brackets',
        treatmentDate: '11/01/2023',
        responsibleDentist: 'Dra. García',
        status: 'En Progreso',
        estimatedCost: 250,
        pendingExams: [],
      });

      const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      // Open modal
      fireEvent.press(getByText('registerTreatment.save'));
      expect(getByText('registerTreatment.modal.title')).toBeTruthy();

      // Confirm modal
      fireEvent.press(getByText('registerTreatment.modal.confirm'));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            patientId: 'patient-mariana-lopez-123',
            category: 'Ortodoncia',
            treatmentName: 'Colocación de brackets',
            estimatedCost: 250,
          })
        );
        expect(getByText('registerTreatment.toast.title')).toBeTruthy();
        expect(getByText('registerTreatment.toast.message')).toBeTruthy();
      });
    });

    it('debe conservar los datos del formulario y mostrar toast de error ante fallo de persistencia', async () => {
      const createSpy = jest.spyOn(treatmentService, 'createTreatment').mockRejectedValueOnce(
        new Error('Network error connecting to Firestore')
      );

      const { getByText, getByPlaceholderText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      const treatmentNameInput = getByPlaceholderText('registerTreatment.placeholders.treatmentName');
      expect(treatmentNameInput.props.value).toBe('Colocación de brackets');

      // Open & confirm modal
      fireEvent.press(getByText('registerTreatment.save'));
      fireEvent.press(getByText('registerTreatment.modal.confirm'));

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalled();
        // Toast de error
        expect(getByText('registerTreatment.toast.errorTitle')).toBeTruthy();
        expect(getByText(/registerTreatment\.toast\.errorMessage/)).toBeTruthy();
      });

      // Comprobar que los datos se conservan en el formulario para reintentar
      expect(treatmentNameInput.props.value).toBe('Colocación de brackets');
      const costInput = getByPlaceholderText('0.00');
      expect(costInput.props.value).toBe('250.00');
    });

    it('debe navegar hacia atrás al presionar cancelar en la pantalla', () => {
      const { getByText } = render(<RegisterTreatmentScreen />);

      fireEvent.press(getByText('registerTreatment.cancel'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('debe evitar operaciones duplicadas mientras se encuentra guardando', async () => {
      let resolvePromise: (val: any) => void;
      const slowPromise = new Promise((res) => {
        resolvePromise = res;
      });

      const createSpy = jest.spyOn(treatmentService, 'createTreatment').mockImplementationOnce(() => slowPromise as any);

      const { getByText, getByPlaceholderText, queryByText } = render(<RegisterTreatmentScreen />);

      fillValidForm(getByPlaceholderText, getByText);

      fireEvent.press(getByText('registerTreatment.save'));

      // Presionar confirmación dos veces seguidas
      const confirmBtn = getByText('registerTreatment.modal.confirm');
      fireEvent.press(confirmBtn);
      fireEvent.press(confirmBtn);

      // Solo debe haberse invocado una vez
      expect(createSpy).toHaveBeenCalledTimes(1);

      // Resolver
      await act(async () => {
        resolvePromise!({ id: 'done' });
      });
    });
  });
});
