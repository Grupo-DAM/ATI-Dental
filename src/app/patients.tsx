import React from 'react';
import { FlatList, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

interface Patient {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  nextAppointment: string;
}

// 30 registros falsos para asegurar que la lista supere la altura de la pantalla
const MOCK_PATIENTS: Patient[] = Array.from({ length: 30 }).map((_, index) => ({
  id: String(index + 1),
  name: `Paciente ${index + 1}`,
  email: `paciente${index + 1}@atidental.com`,
  lastVisit: `2026-05-${String((index % 28) + 1).padStart(2, '0')}`,
  nextAppointment: `2026-06-${String((index % 28) + 1).padStart(2, '0')}`,
}));

export default function PatientsScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  const contentContainerStyle = {
    paddingTop: safeAreaInsets.top + Spacing.three,
    paddingLeft: safeAreaInsets.left + Spacing.three,
    paddingRight: safeAreaInsets.right + Spacing.three,
    paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="default" style={styles.patientName}>
        {item.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.patientEmail}>
        {item.email}
      </ThemedText>

      <ThemedView style={styles.datesContainer}>
        <ThemedView style={styles.dateBlock}>
          <ThemedText type="code" style={styles.dateLabel}>Última Visita</ThemedText>
          <ThemedText type="small">{item.lastVisit}</ThemedText>
        </ThemedView>
        <ThemedView style={styles.dateBlock}>
          <ThemedText type="code" style={[styles.dateLabel, styles.nextLabel]}>Próxima Cita</ThemedText>
          <ThemedText type="smallBold">{item.nextAppointment}</ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.headerTitle}>
        Listado de Pacientes
      </ThemedText>
      <FlatList
        data={MOCK_PATIENTS}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={Platform.OS === 'android'}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    elevation: 2,
  },
  patientName: {
    fontWeight: 'bold',
  },
  patientEmail: {
    marginBottom: Spacing.two,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: Spacing.one,
  },
  dateBlock: {
    backgroundColor: 'transparent',
  },
  dateLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: Spacing.half,
  },
  nextLabel: {
    color: '#3c87f7',
  },
});
