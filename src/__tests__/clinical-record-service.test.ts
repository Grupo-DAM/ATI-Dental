import {
  fetchClinicalRecord,
  deleteConsultation,
  updateConsultation,
  getConsultationsByPatientId,
  CONSULTATIONS_COLLECTION,
  ODONTOGRAMAS_COLLECTION,
  recordScheduledAppointment,
  resolvePatientVisitDates,
  getVisitDatesByPatient,
  getStoredPatientVisitDates,
  updateOdontogram,
} from '@/services/clinical-record-service';
import { firestore } from '@/config/firebase';
import { getSessionToken } from '@/utils/secure-storage';
import { getPatientById } from '@/services/patient-service';
import { getTreatmentsByPatientId } from '@/services/treatment-service';
import { OdontogramData } from '@/types/clinical-record';

jest.mock('@/utils/secure-storage', () => ({
  getSessionToken: jest.fn(),
}));

jest.mock('@/services/patient-service', () => ({
  getPatientById: jest.fn(),
}));

jest.mock('@/services/treatment-service', () => ({
  getTreatmentsByPatientId: jest.fn(),
}));

describe('Clinical Record Service', () => {
  const mockFirestoreInstance = firestore();
  const mockFetch = jest.fn();
  (global as any).fetch = mockFetch;

  const mockPatient = {
    id: 'p-100',
    patientCode: '#P-0042',
    fullName: 'Ana Morales',
    documentId: 'V-11223344',
    email: 'ana@ejemplo.com',
    phone: '04121234567',
    birthDate: '1995-04-10',
    bloodType: 'A+',
    knownAllergies: ['ibuprofeno'],
    medicalHistory: ['asma'],
    status: 'activo' as const,
    nextAppointment: '2024-11-20',
  };

  const mockTreatment = {
    id: 'tr-1',
    patientId: 'p-100',
    patientName: 'Ana Morales',
    patientCedula: 'V-11223344',
    treatmentName: 'Profilaxis Dental',
    responsibleDentist: 'Dr. Lopez',
    treatmentDate: '2023-10-15T09:00:00Z',
    status: 'Completado',
    category: 'Preventivo',
    dentalPiece: 'Toda la boca',
    duration: '30 mins',
    notes: 'Limpieza y aplicación de flúor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = mockFetch;
  });

  describe('fetchClinicalRecord', () => {
    it('retorna error si no se suministra patientId', async () => {
      const res = await fetchClinicalRecord('');
      expect(res.success).toBe(false);
      expect(res.error).toBe('ID de paciente no proporcionado');
    });

    it('consume exitosamente el endpoint serverless con Bearer Token cuando responde ok', async () => {
      (getSessionToken as jest.Mock).mockResolvedValueOnce('mock-jwt-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          patient: mockPatient,
          consultations: [],
          treatments: [mockTreatment],
          odontogram: { status: 'placeholder' },
        }),
      });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.patient.fullName).toBe('Ana Morales');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/historias-clinicas/p-100'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });

    it('continúa a Firestore si la respuesta serverless no contiene datos del paciente', async () => {
      (getSessionToken as jest.Mock).mockResolvedValueOnce(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([]);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.patient.id).toBe('p-100');
    });

    it('hace fallback a Firestore si el fetch serverless falla o arroja excepción', async () => {
      (getSessionToken as jest.Mock).mockRejectedValueOnce(new Error('Secure storage failed'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([mockTreatment]);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.consultations.length).toBeGreaterThan(0);
      expect(res.data?.consultations[0].title).toBe('Profilaxis Dental');
    });

    it('retorna error si el paciente no es encontrado en Firestore', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(null);

      const res = await fetchClinicalRecord('p-inexistente');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Paciente no encontrado en el sistema');
    });

    it('genera consultas por defecto basadas en tratamientos si no hay en Firestore', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Proxy offline'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([
        mockTreatment,
        {
          ...mockTreatment,
          id: '',
          dentalPiece: '',
          duration: '',
          responsibleDentist: '',
          treatmentDate: '2023-11-01',
          treatmentName: 'Revisión General',
          category: '',
          notes: '',
        },
      ]);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.consultations.length).toBe(2);
      expect(res.data?.consultations[0].doctor).toBe('Dr. Smith');
      expect(res.data?.consultations[0].duration).toBe('45 minutos');
    });

    it('genera fallback completo de Figma si no hay tratamientos ni consultas registradas', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const patientWithoutNextAppt = { ...mockPatient, nextAppointment: undefined };
      (getPatientById as jest.Mock).mockResolvedValueOnce(patientWithoutNextAppt);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([]);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({ empty: true, docs: [] });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.consultations.length).toBe(3);
      expect(res.data?.consultations[0].title).toBe('Limpieza dental profunda');
      expect(res.data?.odontogram.status).toBe('placeholder');
    });

    it('utiliza las consultas obtenidas desde Firestore y las ordena cronológicamente descendente', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([]);

      const mockDocs = [
        {
          id: 'doc-old',
          data: () => ({
            patientId: 'p-100',
            date: '2022-01-10T08:00:00Z',
            title: 'Consulta Antigua',
            motivo: 'Control',
            diagnostico: 'Sano',
          }),
        },
        {
          id: 'doc-new',
          data: () => ({
            patientId: 'p-100',
            consultationDate: '2023-12-01T08:00:00Z',
            treatmentName: 'Consulta Reciente',
            category: 'Urgencia',
            notes: 'Dolor agudo',
            diagnosticoDetallado: ['Pulpitis'],
            proximaCita: 'Mañana',
            doctor: 'Dra. Vega',
            duration: '20 mins',
            tratamientosRealizados: 'Apertura',
          }),
        },
        {
          id: 'doc-custom-date',
          data: () => ({
            patientId: 'p-100',
            consultationDate: '15/06/2023',
            treatmentName: 'Formato DD/MM/YYYY',
          }),
        },
      ];

      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: mockDocs,
      });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
      expect(res.data?.consultations[0].id).toBe('doc-new');
      expect(res.data?.consultations[0].doctor).toBe('Dra. Vega');
    });

    it('maneja excepciones de Firestore retornando mensaje amigable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockRejectedValueOnce(new Error('Error de conexión a Firestore'));

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Error de conexión a Firestore');
    });

    it('maneja excepciones de Firestore sin mensaje usando fallback', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockRejectedValueOnce({});

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Error de red al consultar la historia clínica');
    });
  });

  describe('getConsultationsByPatientId', () => {
    it('retorna arreglo vacío si ocurre un error al consultar Firestore', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockRejectedValueOnce(new Error('Firestore down'));
      const result = await getConsultationsByPatientId('p-100');
      expect(result).toEqual([]);
    });

    it('soporta objetos Date con toDate() en parseDateRobustly', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([
        {
          ...mockTreatment,
          treatmentDate: { toDate: () => new Date('2023-05-01') },
        },
      ]);
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'c-date-object',
            data: () => ({
              consultationDate: { toDate: () => new Date('2023-05-02') },
            }),
          },
        ],
      });

      const res = await fetchClinicalRecord('p-100');
      expect(res.success).toBe(true);
    });
  });

  describe('deleteConsultation', () => {
    it('elimina un documento de la colección consultas', async () => {
      (mockFirestoreInstance.delete as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await deleteConsultation('c-123');
      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(CONSULTATIONS_COLLECTION);
      expect(mockFirestoreInstance.doc).toHaveBeenCalledWith('c-123');
      expect(mockFirestoreInstance.delete).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('retorna true incluso si ocurre un error (fallback en memoria)', async () => {
      (mockFirestoreInstance.delete as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));

      const result = await deleteConsultation('c-error');
      expect(result).toBe(true);
    });
  });

  describe('updateConsultation', () => {
    it('actualiza un documento en Firestore con merge', async () => {
      (mockFirestoreInstance.set as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await updateConsultation('c-123', {
        title: 'Nuevo Título',
        diagnostico: 'Diagnóstico Actualizado',
      });

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(CONSULTATIONS_COLLECTION);
      expect(mockFirestoreInstance.doc).toHaveBeenCalledWith('c-123');
      expect(mockFirestoreInstance.set).toHaveBeenCalledWith(
        { title: 'Nuevo Título', diagnostico: 'Diagnóstico Actualizado' },
        { merge: true }
      );
      expect(result).toBe(true);
    });

    it('retorna true si Firestore falla (para consultas virtuales)', async () => {
      (mockFirestoreInstance.set as jest.Mock).mockRejectedValueOnce(new Error('Update error'));

      const result = await updateConsultation('c-error', { title: 'Test' });
      expect(result).toBe(true);
    });
  });

  describe('citas en consultas', () => {
    it('muestra en consultas la cita guardada en la agenda', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([]);
      (mockFirestoreInstance.get as jest.Mock)
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({
          empty: false,
          docs: [{
            id: 'cita-1',
            data: () => ({
              patientId: 'p-100',
              date: '2026-10-20',
              treatmentName: 'Control',
              reason: 'Revisión',
              dentistName: 'Dr. Smith',
              durationMinutes: 30,
              status: 'EN ESPERA',
              notes: 'Traer estudios',
              time: '09:30',
              period: 'AM',
            }),
          }],
        });

      const res = await fetchClinicalRecord('p-100');
      const visit = res.data?.consultations.find((item) => item.title === 'Control');
      expect(visit?.motivo).toBe('Revisión');
      expect(visit?.doctor).toBe('Dr. Smith');
      expect(visit?.appointmentId).toBe('cita-1');
    });
  });

  describe('recordScheduledAppointment', () => {
    it('deja la cita pasada como última visita y la fecha indicada como próxima', () => {
      const dates = resolvePatientVisitDates(
        '2026-06-20',
        '01/11/2026',
        {},
        new Date(2026, 9, 1),
      );
      expect(dates.lastVisit).toBe('2026-06-20');
      expect(dates.nextAppointment).toBe('2026-11-01');
    });

    it('toma una cita futura como próxima cita', () => {
      const dates = resolvePatientVisitDates('2026-10-15', undefined, {}, new Date(2026, 9, 1));
      expect(dates.lastVisit).toBeUndefined();
      expect(dates.nextAppointment).toBe('2026-10-15');
    });

    it('escribe la consulta y las fechas del paciente', async () => {
      const expected = resolvePatientVisitDates('2026-06-20', '01/11/2026', {});
      await recordScheduledAppointment({
        patientId: 'p-100',
        dentistName: 'Dr. Smith',
        appointmentType: 'Control',
        date: '2026-06-20',
        time: '09:30 AM',
        duration: '45 minutos',
        reason: 'Control',
        notes: 'Notas',
        nextDate: '01/11/2026',
        nextTime: '10:00 AM',
        appointmentId: 'apt-1',
      });

      expect(mockFirestoreInstance.add).toHaveBeenCalledWith(expect.objectContaining({
        patientId: 'p-100',
        title: 'Control',
        motivo: 'Control',
        proximaCita: '01 Nov 2026 · 10:00 AM',
        appointmentId: 'apt-1',
      }));
      expect(mockFirestoreInstance.update).toHaveBeenCalledWith(expect.objectContaining({
        nextAppointment: '2026-11-01',
        proxima_vista: '2026-11-01',
        ...(expected.lastVisit
          ? { lastVisit: expected.lastVisit, ultima_visita: expected.lastVisit }
          : {}),
      }));
    });

    it('agrupa las citas guardadas por paciente', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          { id: '1', data: () => ({ patientId: 'p-100', date: '2026-01-10', status: 'COMPLETADO' }) },
          { id: '2', data: () => ({ patientId: 'p-100', date: '2026-12-01', status: 'EN ESPERA' }) },
          { id: '3', data: () => ({ date: '' }) },
        ],
      });

      const dates = await getVisitDatesByPatient();

      expect(dates.get('p-100')?.lastVisit).toBe('2026-01-10');
      expect(dates.get('p-100')?.nextAppointment).toBe('2026-12-01');
    });

    it('conserva la cita si no puede escribir la consulta', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (mockFirestoreInstance.get as jest.Mock)
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ultima_visita: '2020-01-01', proxima_vista: '2026-12-01' }),
        });
      (mockFirestoreInstance.update as jest.Mock).mockRejectedValueOnce(new Error('no doc'));
      (mockFirestoreInstance.set as jest.Mock).mockRejectedValueOnce(new Error('set fail'));
      (mockFirestoreInstance.add as jest.Mock).mockRejectedValueOnce(new Error('consultas'));

      await recordScheduledAppointment({
        patientId: 'p-100',
        dentistName: 'Dr. Smith',
        appointmentType: 'Control',
        date: '2026-06-20',
        time: '09:30 AM',
        duration: '45 minutos',
        reason: 'Control',
        appointmentId: 'apt-2',
      });

      expect(mockFirestoreInstance.set).toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('une consultas locales y omite citas canceladas o ajenas', async () => {
      (getSessionToken as jest.Mock).mockResolvedValueOnce('mock-jwt-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          patient: mockPatient,
          consultations: [{
            id: 'server-1',
            consultationDate: '2026-01-01T12:00:00',
            title: 'Server',
            appointmentId: 'cita-1',
          }],
        }),
      });
      (getPatientById as jest.Mock).mockResolvedValueOnce({
        id: 'p-100',
        nextAppointment: '2026-12-01',
        lastVisit: '2026-01-10',
      });
      (mockFirestoreInstance.get as jest.Mock)
        .mockResolvedValueOnce({
          empty: false,
          docs: [{
            id: 'local-1',
            data: () => ({
              patientId: 'p-100',
              consultationDate: '2026-03-01T12:00:00',
              title: 'Local',
            }),
          }],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [
            { id: 'cita-1', data: () => ({ patientId: 'p-100', date: '2026-10-20', status: 'EN ESPERA', treatmentName: 'Control' }) },
            { id: 'cancel', data: () => ({ patientId: 'p-100', date: '2026-10-20', status: 'CANCELADO', treatmentName: 'X' }) },
            { id: 'other', data: () => ({ patientId: 'otro', date: '2026-10-20', status: 'EN ESPERA' }) },
            { id: 'bare', data: () => ({ patientId: 'p-100', date: '2026-10-21', status: 'EN ESPERA' }) },
          ],
        });

      const res = await fetchClinicalRecord('p-100');
      const titles = res.data?.consultations.map((item) => item.title);
      expect(titles).toEqual(expect.arrayContaining(['Server', 'Local', 'Consulta Odontológica']));
      expect(res.data?.patient.lastVisit).toBe('2026-01-10');
      expect(res.data?.consultations.some((item) => item.title === 'X')).toBe(false);
    });

    it('sigue mostrando la historia si no puede leer las citas', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
      (getTreatmentsByPatientId as jest.Mock).mockResolvedValueOnce([]);
      (mockFirestoreInstance.get as jest.Mock)
        .mockResolvedValueOnce({ empty: true, docs: [] })
        .mockRejectedValueOnce(new Error('citas down'));

      const res = await fetchClinicalRecord('p-100');

      expect(res.success).toBe(true);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('getStoredPatientVisitDates', () => {
    it('obtiene fechas almacenadas de un paciente específico', async () => {
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          { id: '1', data: () => ({ patientId: 'p-100', date: '2026-01-15', status: 'COMPLETADO' }) },
        ],
      });

      const dates = await getStoredPatientVisitDates('p-100');
      expect(dates.lastVisit).toBe('2026-01-15');
    });
  });

  describe('updateOdontogram', () => {
    const mockOdontogramData: OdontogramData = {
      patientId: 'p-100',
      updatedAt: '2026-10-02T00:00:00Z',
      isAdult: true,
      status: 'active',
      notes: 'Nota general del odontograma',
      teeth: {
        16: {
          number: 16,
          generalStates: ['filled'],
          surfacesStates: {
            mesial: 'cavity',
            oclusal: 'filled',
            distal: 'unknown_state',
          },
          notes: 'Sensibilidad',
        },
        21: {
          number: 21,
          generalStates: ['missing'],
        },
      },
    };

    it('lanza un error si el objeto odontogram no tiene patientId', async () => {
      await expect(
        updateOdontogram({ patientId: '' } as any, true)
      ).rejects.toThrow('[clinical-record-service] Imposible actualizar: pacienteId faltante.');
    });

    it('actualiza el odontograma exitosamente via Proxy Serverless', async () => {
      (getSessionToken as jest.Mock).mockResolvedValueOnce('valid-token');
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await updateOdontogram(mockOdontogramData, true);
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/odontogramas/p-100'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('hace fallback a Firestore si el serverless falla y actualiza el documento existente si es de hoy', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Proxy error'));
      const todayIso = new Date().toISOString();

      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'odontogram-doc-1',
            data: () => ({
              fechaRegistro: todayIso,
            }),
          },
        ],
      });
      (mockFirestoreInstance.set as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await updateOdontogram(mockOdontogramData, true);

      expect(result).toBe(true);
      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(ODONTOGRAMAS_COLLECTION);
      expect(mockFirestoreInstance.doc).toHaveBeenCalledWith('odontogram-doc-1');
      expect(mockFirestoreInstance.set).toHaveBeenCalledWith(
        expect.objectContaining({
          pacienteId: 'p-100',
          tipo: 'adulto',
          notasGeneral: 'Nota general del odontograma',
          estadoPiezas: expect.objectContaining({
            '16': {
              estado_general: 'obturado',
              caras: { mesial: 'caries', oclusal: 'obturado' },
              notas: 'Sensibilidad',
            },
            '21': {
              estado_general: 'ausente',
              caras: null,
              notas: null,
            },
          }),
        }),
        { merge: true }
      );
    });

    it('crea un nuevo documento en Firestore si no existe registro previo del mismo día', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Proxy offline'));

      // Devuelve un registro previo de una fecha pasada
      (mockFirestoreInstance.get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'odontogram-doc-old',
            data: () => ({
              fechaRegistro: '2023-01-01T10:00:00.000Z',
            }),
          },
        ],
      });
      (mockFirestoreInstance.add as jest.Mock).mockResolvedValueOnce({ id: 'new-odontogram-doc' });

      const result = await updateOdontogram(mockOdontogramData, false);

      expect(result).toBe(true);
      expect(mockFirestoreInstance.add).toHaveBeenCalledWith(
        expect.objectContaining({
          pacienteId: 'p-100',
          tipo: 'pediatrico',
        })
      );
    });

    it('lanza un error explicativo si Firestore falla durante el guardado del odontograma', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (mockFirestoreInstance.get as jest.Mock).mockRejectedValueOnce(new Error('Error de permisos en Firestore'));

      await expect(updateOdontogram(mockOdontogramData, true)).rejects.toThrow('Error de permisos en Firestore');
    });

    it('lanza el mensaje fallback si el error de Firestore no contiene message', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      (mockFirestoreInstance.get as jest.Mock).mockRejectedValueOnce({});

      await expect(updateOdontogram(mockOdontogramData, true)).rejects.toThrow('Error de red al guardar el odontograma clínico.');
    });
  });

  describe('Casos de borde en utilidades de fechas', () => {
    it('maneja instancias de Date inválidas (NaN) en resolvePatientVisitDates', () => {
      const invalidDate = new Date('fecha-invalida');
      const dates = resolvePatientVisitDates('invalid-date', undefined, {}, invalidDate);
      expect(dates).toEqual({ lastVisit: undefined, nextAppointment: undefined });
    });

    it('resuelve correctamente la última visita si la fecha previa es más antigua', () => {
      const dates = resolvePatientVisitDates(
        '2026-05-10',
        undefined,
        { lastVisit: '2026-01-01' },
        new Date(2026, 9, 1)
      );
      expect(dates.lastVisit).toBe('2026-05-10');
    });

    it('mantiene la última visita existente si es más reciente que la fecha procesada', () => {
      const dates = resolvePatientVisitDates(
        '2026-01-01',
        undefined,
        { lastVisit: '2026-05-10' },
        new Date(2026, 9, 1)
      );
      expect(dates.lastVisit).toBe('2026-05-10');
    });
  });
});