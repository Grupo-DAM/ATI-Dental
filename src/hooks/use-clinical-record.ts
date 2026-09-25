import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchClinicalRecord, deleteConsultation } from '@/services/clinical-record-service';
import { ClinicalRecord, Consultation } from '@/types/clinical-record';
import { Treatment } from '@/services/treatment-service';

export type ClinicalTab = 'consultas' | 'odontograma' | 'tratamientos';

export function useClinicalRecord(patientId?: string) {
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClinicalTab>('consultas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  const loadData = useCallback(async () => {
    if (!patientId) {
      setError('No se proporcionó un ID de paciente');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchClinicalRecord(patientId);

    if (result.success && result.data) {
      setRecord(result.data);
    } else {
      setError(result.error || 'No se pudo cargar la historia clínica');
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrado reactivo en memoria para Consultas
  const filteredConsultations = useMemo(() => {
    if (!record?.consultations) return [];
    if (!searchQuery.trim()) return record.consultations;

    const q = searchQuery.toLowerCase().trim();
    return record.consultations.filter((c) => {
      const title = (c.title || '').toLowerCase();
      const motivo = (c.motivo || '').toLowerCase();
      const diag = (c.diagnostico || '').toLowerCase();
      const date = (c.consultationDate || '').toLowerCase();
      const doctor = (c.doctor || '').toLowerCase();

      return (
        title.includes(q) ||
        motivo.includes(q) ||
        diag.includes(q) ||
        date.includes(q) ||
        doctor.includes(q)
      );
    });
  }, [record?.consultations, searchQuery]);

  // Filtrado reactivo en memoria para Tratamientos
  const filteredTreatments = useMemo(() => {
    if (!record?.treatments) return [];
    if (!searchQuery.trim()) return record.treatments;

    const q = searchQuery.toLowerCase().trim();
    return record.treatments.filter((t: Treatment) => {
      const name = (t.treatmentName || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const notes = (t.notes || '').toLowerCase();
      const date = (t.treatmentDate || '').toLowerCase();
      const dentist = (t.responsibleDentist || '').toLowerCase();

      return (
        name.includes(q) ||
        cat.includes(q) ||
        notes.includes(q) ||
        date.includes(q) ||
        dentist.includes(q)
      );
    });
  }, [record?.treatments, searchQuery]);

  const handleDeleteConsultation = useCallback(
    async (consultationId: string): Promise<boolean> => {
      const ok = await deleteConsultation(consultationId);
      if (ok && record) {
        setRecord((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            consultations: prev.consultations.filter((c) => c.id !== consultationId),
          };
        });
        if (selectedConsultation?.id === consultationId) {
          setSelectedConsultation(null);
        }
      }
      return ok;
    },
    [record, selectedConsultation]
  );

  return {
    record,
    loading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredConsultations,
    filteredTreatments,
    selectedConsultation,
    setSelectedConsultation,
    refetch: loadData,
    deleteConsultation: handleDeleteConsultation,
  };
}
