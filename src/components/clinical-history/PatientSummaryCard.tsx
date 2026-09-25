import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { Patient } from '@/services/patient-service';

function calculateAge(dateString?: string): number | null {
  if (!dateString) return null;
  try {
    const birth = new Date(dateString);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

function getInitials(name: string): string {
  if (!name) return 'PT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function PatientSummaryCard({
  patient,
  onEditPatient,
}: Readonly<{
  patient: Patient;
  onEditPatient?: () => void;
}>) {
  const { t } = useTranslation();
  const [showMedicalDetails, setShowMedicalDetails] = useState(false);

  const initials = getInitials(patient.fullName);
  const age = calculateAge(patient.birthDate);
  const allergiesList = Array.isArray(patient.knownAllergies) && patient.knownAllergies.length > 0
    ? patient.knownAllergies.join(', ')
    : patient.allergies || 'Ninguna registrada';
  const conditionsList = Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0
    ? patient.medicalHistory.join(', ')
    : patient.conditions || 'Ninguna registrada';

  return (
    <View style={styles.card} testID="patient-summary-card">
      <View style={styles.mainRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.patientName}>{patient.fullName}</Text>
          <Text style={styles.patientMeta}>
            {patient.patientCode || '#P-0042'} · {patient.email || 'sin-correo@email.com'}
          </Text>
          <View style={styles.tagsRow}>
            {patient.documentId ? (
              <View style={styles.tag}>
                <Ionicons name="card-outline" size={12} color="#6B7280" />
                <Text style={styles.tagText}>{patient.documentId}</Text>
              </View>
            ) : null}
            {age !== null ? (
              <View style={styles.tag}>
                <Ionicons name="person-outline" size={12} color="#6B7280" />
                <Text style={styles.tagText}>{age} {t('patientFile.years')}</Text>
              </View>
            ) : null}
            {patient.phone ? (
              <View style={styles.tag}>
                <Ionicons name="call-outline" size={12} color="#6B7280" />
                <Text style={styles.tagText}>{patient.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {onEditPatient && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditPatient}
            activeOpacity={0.7}
            accessibilityLabel="Editar paciente"
          >
            <Ionicons name="create-outline" size={18} color={Colors.light.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Antecedentes Clínicos - Escenario 1 */}
      <View style={styles.medicalSection}>
        <TouchableOpacity
          style={styles.medicalHeader}
          onPress={() => setShowMedicalDetails(!showMedicalDetails)}
          activeOpacity={0.7}
        >
          <View style={styles.medicalHeaderLeft}>
            <Ionicons name="medical" size={15} color={Colors.light.main} />
            <Text style={styles.medicalTitle}>{t('patientFile.medicalBackground')}</Text>
            {patient.bloodType ? (
              <View style={styles.bloodTypeBadge}>
                <Text style={styles.bloodTypeText}>{patient.bloodType}</Text>
              </View>
            ) : null}
          </View>
          <Ionicons
            name={showMedicalDetails ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>

        {showMedicalDetails && (
          <View style={styles.medicalDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('patientFile.knownAllergies')}:</Text>
              <Text style={styles.detailValue}>{allergiesList}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('patientFile.medicalConditions')}:</Text>
              <Text style={styles.detailValue}>{conditionsList}</Text>
            </View>
            {patient.notes ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>{t('patientFile.additionalNotes')}:</Text>
                <Text style={styles.detailValue}>{patient.notes}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Open Sans',
  },
  infoContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: 'Open Sans',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  medicalSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  medicalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medicalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Open Sans',
  },
  bloodTypeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bloodTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: 'Open Sans',
  },
  medicalDetails: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Open Sans',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    maxWidth: '65%',
    textAlign: 'right',
  },
});
