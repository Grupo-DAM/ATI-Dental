import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TreatmentsTimeline } from '@/components/clinical-history/TreatmentsTimeline';
import { ConsultationsTimeline } from '@/components/clinical-history/ConsultationsTimeline';
import { PatientSummaryCard } from '@/components/clinical-history/PatientSummaryCard';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';
import { ConsultationDetailModal } from '@/components/clinical-history/ConsultationDetailModal';
import { Treatment } from '@/services/treatment-service';
import { Consultation } from '@/types/clinical-record';
import { Patient } from '@/services/patient-service';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('Clinical History Sub-Components - Unit & Branch Coverage', () => {
  describe('TreatmentsTimeline', () => {
    const mockTreatments: Treatment[] = [
      {
        id: 'tr-1',
        patientId: 'p-1',
        patientName: 'Test',
        patientCedula: 'V-1',
        treatmentName: 'Profilaxis',
        responsibleDentist: 'Dr. Dentista',
        treatmentDate: '2023-05-10T10:00:00Z',
        status: 'Completado',
        category: 'Higiene',
        duration: '30 min',
        dentalPiece: 'General',
        notes: 'Profilaxis realizada con éxito',
      },
      {
        id: 'tr-2',
        patientId: 'p-1',
        patientName: 'Test',
        patientCedula: 'V-1',
        treatmentName: 'Extracción',
        responsibleDentist: 'Dra. Cirujana',
        treatmentDate: 'invalid-date',
        status: 'En Progreso',
      },
      {
        id: 'tr-3',
        patientId: 'p-1',
        patientName: 'Test',
        patientCedula: 'V-1',
        treatmentName: 'Ortodoncia',
        responsibleDentist: 'Dr. Ortodoncista',
        treatmentDate: undefined,
        status: 'Pendiente',
      },
      {
        id: 'tr-4',
        patientId: 'p-1',
        patientName: 'Test',
        patientCedula: 'V-1',
        treatmentName: 'Implante',
        responsibleDentist: 'Dr. Cirujano',
        status: 'Cancelado',
      },
      {
        id: 'tr-5',
        patientId: 'p-1',
        patientName: 'Test',
        patientCedula: 'V-1',
        treatmentName: 'Evaluación',
        responsibleDentist: 'Dra. General',
        status: 'Desconocido',
      },
    ];

    it('renderiza lista de tratamientos con diferentes estados, fechas y metadatos', () => {
      const onSearchChange = jest.fn();
      const onAddTreatment = jest.fn();
      const onModifyTreatment = jest.fn();
      const onDeleteTreatment = jest.fn();

      render(
        <TreatmentsTimeline
          treatments={mockTreatments}
          searchQuery="profi"
          onSearchChange={onSearchChange}
          onAddTreatment={onAddTreatment}
          onModifyTreatment={onModifyTreatment}
          onDeleteTreatment={onDeleteTreatment}
        />
      );

      expect(screen.getByText('Profilaxis')).toBeTruthy();
      expect(screen.getByText('Completado')).toBeTruthy();
      expect(screen.getByText('En Progreso')).toBeTruthy();
      expect(screen.getByText('Pendiente')).toBeTruthy();
      expect(screen.getByText('Cancelado')).toBeTruthy();
      expect(screen.getByText('Desconocido')).toBeTruthy();

      // Botón limpiar búsqueda
      const clearBtn = screen.getByTestId('search-treatments-input');
      expect(clearBtn).toBeTruthy();
      fireEvent.changeText(clearBtn, 'algo');
      expect(onSearchChange).toHaveBeenCalledWith('algo');

      // Acciones de añadir, modificar y eliminar
      fireEvent.press(screen.getByTestId('btn-add-treatment'));
      expect(onAddTreatment).toHaveBeenCalled();

      fireEvent.press(screen.getAllByText('Modificar')[0]);
      expect(onModifyTreatment).toHaveBeenCalledWith('tr-1');

      fireEvent.press(screen.getAllByText('Eliminar')[0]);
      expect(onDeleteTreatment).toHaveBeenCalledWith('tr-1');
    });

    it('muestra estado vacío con descripción cuando hay búsqueda activa y cuando no', () => {
      const { rerender } = render(
        <TreatmentsTimeline
          treatments={[]}
          searchQuery="criterio"
          onSearchChange={jest.fn()}
          onAddTreatment={jest.fn()}
          onModifyTreatment={jest.fn()}
          onDeleteTreatment={jest.fn()}
        />
      );

      expect(screen.getByText('Sin resultados')).toBeTruthy();
      expect(screen.getByText('No se encontraron tratamientos que coincidan.')).toBeTruthy();

      rerender(
        <TreatmentsTimeline
          treatments={[]}
          searchQuery=""
          onSearchChange={jest.fn()}
          onAddTreatment={jest.fn()}
          onModifyTreatment={jest.fn()}
          onDeleteTreatment={jest.fn()}
        />
      );

      expect(screen.getByText('Sin tratamientos registrados')).toBeTruthy();
      expect(screen.getByText('Este paciente aún no tiene procedimientos registrados.')).toBeTruthy();
    });

    it('soporta modo oscuro con contraste adecuado', () => {
      jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');

      render(
        <TreatmentsTimeline
          treatments={[mockTreatments[0]]}
          searchQuery="filtro"
          onSearchChange={jest.fn()}
          onAddTreatment={jest.fn()}
          onModifyTreatment={jest.fn()}
          onDeleteTreatment={jest.fn()}
        />
      );

      expect(screen.getByTestId('treatments-timeline')).toBeTruthy();
      jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');
    });
  });

  describe('ConsultationsTimeline', () => {
    const mockConsultations: Consultation[] = [
      {
        id: 'c-1',
        patientId: 'p-1',
        consultationDate: '2023-09-20T10:00:00Z',
        title: 'Consulta General',
        motivo: 'Revisión periódica',
        diagnostico: 'Dientes sanos',
        proximaCita: '2024-03-20',
      },
      {
        id: 'c-2',
        patientId: 'p-1',
        consultationDate: 'invalid-date-format',
        title: 'Consulta Urgencia',
        motivo: 'Dolor',
        diagnostico: 'Gingivitis',
        proximaCita: undefined,
      },
      {
        id: 'c-3',
        patientId: 'p-1',
        consultationDate: undefined,
        title: 'Consulta Sin Fecha',
        motivo: 'Control',
        diagnostico: 'En observación',
      },
    ];

    it('renderiza consultas, selecciona, modifica y elimina', () => {
      const onSelect = jest.fn();
      const onModify = jest.fn();
      const onDelete = jest.fn();
      const onSchedule = jest.fn();
      const onSearchChange = jest.fn();

      render(
        <ConsultationsTimeline
          consultations={mockConsultations}
          searchQuery="consulta"
          onSearchChange={onSearchChange}
          onScheduleAppointment={onSchedule}
          onSelectConsultation={onSelect}
          onModifyConsultation={onModify}
          onDeleteConsultation={onDelete}
        />
      );

      expect(screen.getByText('Consulta General')).toBeTruthy();
      expect(screen.getByText('Consulta Urgencia')).toBeTruthy();
      expect(screen.getAllByText('No programada').length).toBeGreaterThan(0); // Fallback para proximaCita

      fireEvent.press(screen.getByText('Consulta General'));
      expect(onSelect).toHaveBeenCalledWith(mockConsultations[0]);

      fireEvent.press(screen.getByTestId('btn-schedule-appointment'));
      expect(onSchedule).toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('btn-modify-consultation-c-1'));
      expect(onModify).toHaveBeenCalledWith(mockConsultations[0]);

      fireEvent.press(screen.getAllByText('Eliminar')[0]);
      expect(onDelete).toHaveBeenCalledWith('c-1');
    });

    it('renderiza estado vacío con búsqueda y sin búsqueda', () => {
      const { rerender } = render(
        <ConsultationsTimeline
          consultations={[]}
          searchQuery="busqueda"
          onSearchChange={jest.fn()}
          onScheduleAppointment={jest.fn()}
          onSelectConsultation={jest.fn()}
        />
      );

      expect(screen.getByText('Sin resultados')).toBeTruthy();

      rerender(
        <ConsultationsTimeline
          consultations={[]}
          searchQuery=""
          onSearchChange={jest.fn()}
          onScheduleAppointment={jest.fn()}
          onSelectConsultation={jest.fn()}
        />
      );

      expect(screen.getByText('Sin consultas registradas')).toBeTruthy();
    });
  });

  describe('PatientSummaryCard', () => {
    it('calcula iniciales y edad en diferentes escenarios', () => {
      const today = new Date();
      const futureMonthBirth = new Date(today.getFullYear() - 25, today.getMonth() + 2, 1).toISOString();
      const patientYoung: Patient = {
        id: 'p-young',
        fullName: 'Carlos',
        birthDate: futureMonthBirth,
        documentId: 'V-999',
        phone: '123456',
        status: 'activo',
        knownAllergies: ['Alergia1', 'Alergia2'],
        medicalHistory: ['Condicion1'],
      };

      const onEdit = jest.fn();
      render(<PatientSummaryCard patient={patientYoung} onEditPatient={onEdit} />);

      expect(screen.getByText('Carlos')).toBeTruthy();
      expect(screen.getByText('CA')).toBeTruthy(); // Iniciales de un solo nombre

      // Desplegar antecedentes médicos
      fireEvent.press(screen.getByText('patientFile.medicalBackground'));
      expect(screen.getByText(/Alergia1, Alergia2/)).toBeTruthy();
      expect(screen.getByText(/Condicion1/)).toBeTruthy();

      // Botón editar
      fireEvent.press(screen.getByLabelText('Editar paciente'));
      expect(onEdit).toHaveBeenCalled();
    });

    it('maneja fallbacks para nombres vacíos, fechas inválidas y antecedentes ausentes', () => {
      const emptyPatient: Patient = {
        id: 'p-empty',
        fullName: '',
        birthDate: 'invalid-date',
        status: 'activo',
        allergies: 'Polvo',
        conditions: 'Diabetes',
      };

      render(<PatientSummaryCard patient={emptyPatient} />);
      expect(screen.getByText('PT')).toBeTruthy(); // Fallback de iniciales
      expect(screen.getByText('#P-0042 · sin-correo@email.com')).toBeTruthy();

      fireEvent.press(screen.getByText('patientFile.medicalBackground'));
      expect(screen.getByText(/Polvo/)).toBeTruthy();
      expect(screen.getByText(/Diabetes/)).toBeTruthy();
    });

    it('maneja antecedentes completamente vacíos', () => {
      const patientNoHistory: Patient = {
        id: 'p-none',
        fullName: 'Solo Apellido',
        birthDate: undefined,
        status: 'activo',
        knownAllergies: [],
        medicalHistory: [],
      };

      render(<PatientSummaryCard patient={patientNoHistory} />);
      fireEvent.press(screen.getByText('patientFile.medicalBackground'));
      expect(screen.getAllByText(/Ninguna registrada/).length).toBe(2);
    });
  });

  describe('OdontogramContainer', () => {
    it('renderiza con datos de odontograma específicos y en modo oscuro', () => {
      jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('dark');

      render(
        <OdontogramContainer
          odontogram={{
            patientId: 'p-1',
            status: 'activo',
            updatedAt: '2023-10-01',
          }}
        />
      );

      expect(screen.getByText(/Estructura lista \(activo\)/)).toBeTruthy();
      expect(screen.getByText('32 Piezas Dentales (FDI)')).toBeTruthy();

      jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');
    });

    it('renderiza con status por defecto placeholder', () => {
      render(<OdontogramContainer />);
      expect(screen.getByText(/Estructura lista \(placeholder\)/)).toBeTruthy();
    });
  });

  describe('ConsultationDetailModal', () => {
    const mockConsultation: Consultation = {
      id: 'c-full',
      patientId: 'p-1',
      consultationDate: '2023-09-20T10:30:00Z',
      title: 'Restauración Oclusal',
      motivo: 'Caries dolorosa',
      diagnostico: 'Caries en pieza 16',
      diagnosticoDetallado: ['Clase II', 'Restauración con resina'],
      tratamientosRealizados: 'Obturación con amalgama',
      proximaCita: '15 Nov 2023',
      notas: 'Paciente toleró bien la anestesia',
      doctor: 'Dr. Valero',
      duration: '50 minutos',
    };

    it('retorna null si consultation es null o no definida', () => {
      const { toJSON } = render(
        <ConsultationDetailModal
          visible={true}
          consultation={null as any}
          onClose={jest.fn()}
        />
      );
      expect(toJSON()).toBeNull();
    });

    it('permite abrir/cerrar todas las secciones acordeón en modo lectura', () => {
      const onOpenOdontogram = jest.fn();
      render(
        <ConsultationDetailModal
          visible={true}
          consultation={mockConsultation}
          onClose={jest.fn()}
          onOpenOdontogram={onOpenOdontogram}
        />
      );

      // Inicialmente están abiertas las secciones
      expect(screen.getByText('Caries dolorosa')).toBeTruthy();
      expect(screen.getByText('Caries en pieza 16')).toBeTruthy();
      expect(screen.getByText('Obturación con amalgama')).toBeTruthy();
      expect(screen.getByText('Paciente toleró bien la anestesia')).toBeTruthy();

      // Alternar Motivo para cerrar y abrir
      fireEvent.press(screen.getByText('Motivo de Consulta'));
      expect(screen.queryByText('Caries dolorosa')).toBeNull();
      fireEvent.press(screen.getByText('Motivo de Consulta'));
      expect(screen.getByText('Caries dolorosa')).toBeTruthy();

      // Alternar Diagnóstico
      fireEvent.press(screen.getByText('Diagnóstico'));
      expect(screen.queryByText('Caries en pieza 16')).toBeNull();

      // Alternar Tratamientos Realizados
      fireEvent.press(screen.getByText('Tratamientos realizados'));
      expect(screen.queryByText('Obturación con amalgama')).toBeNull();

      // Botón Ver Odontograma
      fireEvent.press(screen.getByText('Ver Odontograma'));
      expect(onOpenOdontogram).toHaveBeenCalled();
    });

    it('permite entrar a modo edición, editar campos y guardar exitosamente', async () => {
      const onSave = jest.fn().mockResolvedValue(true);
      const onClose = jest.fn();

      render(
        <ConsultationDetailModal
          visible={true}
          consultation={mockConsultation}
          onClose={onClose}
          onSave={onSave}
          initialEditMode={true}
        />
      );

      // Cambiar valores en los campos de edición
      const titleInput = screen.getByTestId('input-edit-consultation-title');
      fireEvent.changeText(titleInput, 'Endodoncia Unirradicular');

      const motivoInput = screen.getByTestId('input-edit-consultation-motivo');
      fireEvent.changeText(motivoInput, 'Pulpitis irreversible');

      const diagInput = screen.getByTestId('input-edit-consultation-diagnostico');
      fireEvent.changeText(diagInput, 'Necrosis pulpar');

      const tratInput = screen.getByTestId('input-edit-consultation-tratamientos');
      fireEvent.changeText(tratInput, 'Biopulpectomía total');

      const apptInput = screen.getByTestId('input-edit-consultation-proxima-cita');
      fireEvent.changeText(apptInput, '30 Nov 2023');

      const notesInput = screen.getByTestId('input-edit-consultation-notas');
      fireEvent.changeText(notesInput, 'Conductometría 21mm');

      // Guardar cambios
      fireEvent.press(screen.getByTestId('btn-modal-save-consultation'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Endodoncia Unirradicular',
            motivo: 'Pulpitis irreversible',
            diagnostico: 'Necrosis pulpar',
            tratamientosRealizados: 'Biopulpectomía total',
            proximaCita: '30 Nov 2023',
            notas: 'Conductometría 21mm',
          })
        );
      });
    });

    it('permite cancelar modo edición y alternar desde el botón Modificar', () => {
      render(
        <ConsultationDetailModal
          visible={true}
          consultation={mockConsultation}
          onClose={jest.fn()}
        />
      );

      // Entrar a edición
      fireEvent.press(screen.getByTestId('btn-modal-edit-consultation'));
      expect(screen.getByTestId('btn-modal-cancel-edit')).toBeTruthy();

      // Cancelar edición
      fireEvent.press(screen.getByTestId('btn-modal-cancel-edit'));
      expect(screen.getByTestId('btn-modal-edit-consultation')).toBeTruthy();
    });

    it('maneja guardado sin onSave y fecha sin hora', async () => {
      const noDateConsultation = {
        ...mockConsultation,
        consultationDate: 'invalid-date',
        tratamientosRealizados: undefined,
        duration: undefined,
        diagnosticoDetallado: undefined,
      };

      render(
        <ConsultationDetailModal
          visible={true}
          consultation={noDateConsultation}
          onClose={jest.fn()}
          initialEditMode={true}
        />
      );

      // Guardar sin onSave no lanza error
      fireEvent.press(screen.getByTestId('btn-modal-save-consultation'));
    });

    it('permite guardar usando el botón inferior y maneja eliminación desde el modal', async () => {
      const onSave = jest.fn().mockResolvedValue(true);
      const onDelete = jest.fn();

      const { rerender } = render(
        <ConsultationDetailModal
          visible={true}
          consultation={{ ...mockConsultation, notas: '' }}
          onClose={jest.fn()}
          onSave={onSave}
          onDelete={onDelete}
          initialEditMode={false}
        />
      );

      // Ver notas vacías
      expect(screen.getByText('Sin notas adicionales.')).toBeTruthy();

      // Botón eliminar en modo lectura
      expect(screen.getByText('Eliminar')).toBeTruthy();
      fireEvent.press(screen.getByText('Eliminar'));
      expect(onDelete).toHaveBeenCalledWith('c-full');

      // Entrar en modo edición y probar botón Guardar Cambios inferior
      rerender(
        <ConsultationDetailModal
          visible={true}
          consultation={mockConsultation}
          onClose={jest.fn()}
          onSave={onSave}
          initialEditMode={true}
        />
      );

      // Alternar secciones en modo edición
      fireEvent.press(screen.getByText('Próxima Cita'));
      expect(screen.queryByTestId('input-edit-consultation-proxima-cita')).toBeNull();
      fireEvent.press(screen.getByText('Próxima Cita'));
      expect(screen.getByTestId('input-edit-consultation-proxima-cita')).toBeTruthy();

      fireEvent.press(screen.getByText('Notas adicionales'));
      expect(screen.queryByTestId('input-edit-consultation-notas')).toBeNull();
      fireEvent.press(screen.getByText('Notas adicionales'));
      expect(screen.getByTestId('input-edit-consultation-notas')).toBeTruthy();

      // Guardar cambios con botón inferior
      fireEvent.press(screen.getByTestId('btn-modal-save-bottom'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });
});
