import {
  mapPatientToDirectoryRow,
  buildPatientDirectoryHtml,
  exportPatientDirectoryPdf,
} from '@/services/patient-directory-export';
import { ReportService } from '@/services/report-service';

describe('Patient Directory Export Service (US-34)', () => {
  const mockPatientA = {
    id: 'firestore-internal-id-123',
    patientCode: 'PAC-001',
    fullName: 'Carlos Gómez',
    phone: '+584141112233',
    email: 'carlos@test.com',
    lastVisit: '2025-01-15',
    nextAppointment: '2025-02-20',
  };

  const mockPatientB = {
    id: 'firestore-internal-id-456',
    patientCode: '',
    fullName: 'Ana Pérez',
    phone: '',
    email: 'ana@test.com',
    ultima_visita: '',
    proxima_visita: '',
  };

  it('mapea un paciente a la fila con 5 columnas sin exponer identificadores internos de Firestore', () => {
    const row = mapPatientToDirectoryRow(mockPatientA);
    expect(row).toHaveLength(5);
    expect(row[0]).toBe('PAC-001');
    expect(row[1]).toBe('Carlos Gómez');
    expect(row[2]).toBe('+584141112233 / carlos@test.com');
    expect(row).not.toContain('firestore-internal-id-123');
  });

  it('asigna guión ("—") cuando faltan datos como teléfono o citas', () => {
    const row = mapPatientToDirectoryRow(mockPatientB);
    expect(row[0]).toBe('—');
    expect(row[1]).toBe('Ana Pérez');
    expect(row[2]).toBe('ana@test.com');
    expect(row[3]).toBe('—');
    expect(row[4]).toBe('—');
  });

  it('construye la estructura HTML con membrete, métricas y reglas anti-corte', () => {
    const result = buildPatientDirectoryHtml([mockPatientA, mockPatientB] as any, {
      patients: [mockPatientA, mockPatientB] as any,
      language: 'es',
      searchQuery: 'Carlos',
    });

    expect(result.metadata.title).toBe('Directorio de Pacientes');
    expect(result.metadata.subtitle).toContain('Carlos');
    expect(result.contentHtml).toContain('TOTAL DE PACIENTES');
    expect(result.contentHtml).toContain('PAC-001');
    expect(result.customStyles).toContain('page-break-inside: avoid');
  });

  it('llama a ReportService.generateAndShare con los parámetros adecuados', async () => {
    const spy = jest.spyOn(ReportService, 'generateAndShare').mockResolvedValueOnce({
      file: { uri: 'file://mock-dir.pdf', numberOfPages: 1 },
      share: { shared: true },
    });

    await exportPatientDirectoryPdf({
      patients: [mockPatientA] as any,
      language: 'es',
      generatedBy: 'Dr. Valerio',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          title: 'Directorio de Pacientes',
          generatedBy: 'Dr. Valerio',
        }),
      }),
      expect.any(Object)
    );

    spy.mockRestore();
  });
});