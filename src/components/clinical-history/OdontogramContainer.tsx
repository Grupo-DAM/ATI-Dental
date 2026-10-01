import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { ALL_TOOTH_STATES, OdontogramData, ToothCondition } from '@/types/clinical-record';
import { useDentalPiecesPerCuadrant } from '@/hooks/use-dental-pieces-per-cuadrant';
import { createOdontogramStyles } from '@/constants/styles/patients.style';
import { DentalCuadrant, DentalPiece } from '@/components/clinical-history/DentalPiece';
import { FontSize } from '@/constants/theme';

interface Props {
  readonly odontogram?: OdontogramData;
}

function getToothStateColor(theme: any, state: string) {
  return theme[state] || theme.backgroundElement;
}

export function OdontogramContainer({ odontogram }: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createOdontogramStyles(theme), [theme]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const mockOdontogramData: OdontogramData = {
  patientId: "pat_98231405",
  updatedAt: new Date().toISOString(),
  status: "ready",
  isAdult: true,
  notes: "Paciente adulto con restauraciones previas y caries activas interproximales.",
  teeth: {
    // =========================================================================
    // CUADRANTE 1: Superior Derecho (Requiere flip: true en el hook de assets)
    // =========================================================================
    11: {
      number: 11,
      generalStates: [], // El arreglo vacío significa Diente Sano (isHealthy = true)
    },
    12: {
      number: 12,
      generalStates: ['cavity'], // Estado general: Caries (Punto Rojo)
      surfacesStates: {
        oclusal: 'caries',
        mesial: 'caries',
      },
    },
    13: {
      number: 13,
      generalStates: ['filled'], // Estado general: Obturado / Resina (Punto Azul)
      surfacesStates: {
        distal: 'obturado',
      },
    },

    // =========================================================================
    // CUADRANTE 2: Superior Izquierdo (Requiere flip: false en el hook de assets)
    // =========================================================================
    21: {
      number: 21,
      generalStates: [], // Sano
    },
    24: {
      number: 24,
      generalStates: ['missing'], // Diente ausente (Punto Gris)
    },
    26: {
      number: 26,
      generalStates: ['root_canal', 'fixed_dental_prosthesis'], // Múltiples estados (Endodoncia + Corona)
    },

    // =========================================================================
    // CUADRANTE 3: Inferior Izquierdo (Requiere flip: false en el hook de assets)
    // =========================================================================
    31: {
      number: 31,
      generalStates: [], // Sano
    },
    36: {
      number: 36,
      generalStates: ['implant'], // Implante dental colocado
    },
    37: {
      number: 37,
      generalStates: ['retained_root'], // Solo queda la raíz
    },

    // =========================================================================
    // CUADRANTE 4: Inferior Derecho (Requiere flip: true en el hook de assets)
    // =========================================================================
    41: {
      number: 41,
      generalStates: [], // Sano
    },
    46: {
      number: 46,
      generalStates: ['in_eruption'], // Diente en erupción
    },
    48: {
      number: 48,
      generalStates: ['temporal'], // Tratamiento o corona temporal
      surfacesStates: {
        vestibular: 'temporal',
      },
    },
  },
};

  const cuadrantsData = useDentalPiecesPerCuadrant(
    mockOdontogramData.isAdult ?? true, 
    mockOdontogramData.teeth
  );

  const leftCuadrants = mockOdontogramData.isAdult ? [ 1, 4 ] : [ 5, 8 ];
  const rightCuadrants = mockOdontogramData.isAdult ? [ 2, 3 ] : [ 6, 7 ];

  return (
    <View style={styles.container} testID="odontogram-container">
      {/* New odontogram action buttons */}
      <View style={styles.actionBtnsContainer}>
        <TouchableOpacity style={[styles.actionBtnShell, mockOdontogramData.isAdult && styles.actionBtnShellActive]}>
          <Ionicons name="add" size={FontSize.h5} color={mockOdontogramData.isAdult? theme.overMain : theme.pageSubtitle} />
          <Text style={[styles.actionBtnText, mockOdontogramData.isAdult && styles.actionBtnTextActive]}>
            {t('odontogram.adult')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnShell, !mockOdontogramData.isAdult && styles.actionBtnShellActive]}>
          <Ionicons name="add" size={FontSize.h5} color={mockOdontogramData.isAdult? theme.pageSubtitle : theme.overMain} />
          <Text style={[styles.actionBtnText, !mockOdontogramData.isAdult && styles.actionBtnTextActive]}>
            {t('odontogram.pediatric')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
       contentContainerStyle={styles.legendContainer}>
        {ALL_TOOTH_STATES.map((state, index: number) => (
          <View style={styles.legendItem} key={'state'+index}>
            <View style={[styles.legendDot, {backgroundColor: getToothStateColor(theme, state)}]}></View>
            <Text style={styles.legendText}>{t(`odontogram.toothStatus.${state}`)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Scroll odontogram */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle = {styles.odontogramScrollContainer}
      >
        <View key={'leftCuadrants'} style={styles.halfOdontogram}>
          {leftCuadrants.map((cuadrant, index: number) => (
            <DentalCuadrant 
              teeth={cuadrantsData[cuadrant]} 
              isLeftCuadrant = {true}
              isBottomCuadrant = {index === 1}
              selectedTooth={selectedTooth} 
              setSelectedTooth={setSelectedTooth}/>
          ))}
        </View>

        <Svg height="100%" width="2">
          <Line
            x1="0"
            y1="1"
            x2="0"
            y2="100%"
            stroke={theme.breadcrumbSeparator} // Color de la línea
            strokeWidth="4"  // Grosor de la línea
            strokeDasharray="4, 4" // [Longitud del punto, Espacio entre puntos] 
          />
        </Svg>

        <View key={'rightCuadrants'} style={styles.halfOdontogram}>
          {rightCuadrants.map((cuadrant, index: number) => (
            <DentalCuadrant 
              teeth={cuadrantsData[cuadrant]} 
              isLeftCuadrant = {false}
              isBottomCuadrant = {index === 1}
              selectedTooth={selectedTooth} 
              setSelectedTooth={setSelectedTooth}/>
          ))}
        </View>

        <View>

        </View>
      </ScrollView>

      {/* hint */}

    </View>
  );
}