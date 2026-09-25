import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { OdontogramData } from '@/types/clinical-record';

interface Props {
  readonly odontogram?: OdontogramData;
}

export function OdontogramContainer({ odontogram }: Readonly<Props>) {
  const { t } = useTranslation();

  return (
    <View style={styles.card} testID="odontogram-container">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="medkit" size={20} color={Colors.light.main} />
          <Text style={styles.title}>
            {t('clinicalHistory.odontogramTitle', 'Odontograma Dental')}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t('clinicalHistory.comingSoon', 'Próximamente')}
          </Text>
        </View>
      </View>

      {/* Placeholder visual */}
      <View style={styles.placeholderBox}>
        <View style={styles.iconCircle}>
          <Ionicons name="fitness-outline" size={40} color={Colors.light.main} />
        </View>
        <Text style={styles.placeholderTitle}>
          {t('clinicalHistory.odontogramPlaceholderTitle', 'Módulo de Odontograma Digital')}
        </Text>
        <Text style={styles.placeholderMessage}>
          {t(
            'clinicalHistory.odontogramPlaceholderDesc',
            'Este contenedor modular está preparado con la estructura de datos para la inyección del componente gráfico interactivo en el siguiente sprint.'
          )}
        </Text>

        {/* Feature Pills */}
        <View style={styles.pillsRow}>
          <View style={styles.pill}>
            <Ionicons name="checkmark-circle-outline" size={14} color={Colors.light.main} />
            <Text style={styles.pillText}>32 Piezas Dentales (FDI)</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="layers-outline" size={14} color={Colors.light.main} />
            <Text style={styles.pillText}>5 Superficies por Diente</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="sync-outline" size={14} color={Colors.light.main} />
            <Text style={styles.pillText}>Estado Sincronizado</Text>
          </View>
        </View>
      </View>

      {/* Metadata status footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Estado del módulo: <Text style={{ fontWeight: '700', color: Colors.light.main }}>Estructura lista ({odontogram?.status || 'placeholder'})</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  badge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.main,
    fontFamily: 'Open Sans',
  },
  placeholderBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 6,
    textAlign: 'center',
  },
  placeholderMessage: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 5,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Open Sans',
  },
  footer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
  },
});
