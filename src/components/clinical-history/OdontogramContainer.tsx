import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { ALL_TOOTH_STATES, OdontogramData, ToothCondition } from '@/types/clinical-record';
import { useDentalPiecesPerCuadrant } from '@/hooks/use-dental-pieces-per-cuadrant';
import { createOdontogramStyles } from '@/constants/styles/patients.style';
import { DentalCuadrant } from '@/components/clinical-history/DentalPiece';
import { FontSize } from '@/constants/theme';

interface Props {
  readonly odontogram?: OdontogramData;
  readonly onToothSelect?: (tooth: ToothCondition) => void;
}

function getToothStateColor(theme: any, state: string) {
  return theme[state] || theme.backgroundElement;
}

const DEFAULT_ODONTOGRAM: OdontogramData = {
  patientId: '',
  status: 'placeholder',
  isAdult: true,
  teeth: {}, 
};

export function OdontogramContainer({ odontogram, onToothSelect }: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createOdontogramStyles(theme), [theme]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const safeOdontogram = odontogram || DEFAULT_ODONTOGRAM;

  const cuadrantsData = useDentalPiecesPerCuadrant(
    safeOdontogram.isAdult ?? true, 
    safeOdontogram.teeth
  );

  React.useEffect(() => {
    if (selectedTooth !== null && onToothSelect) {
      // Buscamos los datos existentes en la base de datos para ese diente
      const toothData = safeOdontogram.teeth?.[selectedTooth] || {
        number: selectedTooth,
        generalStates: [],
      };
      onToothSelect(toothData);
      
      // Reseteamos la selección interna para permitir volver a tocar el mismo diente luego
      setSelectedTooth(null); 
    }
  }, [selectedTooth, safeOdontogram.teeth, onToothSelect]);

  const leftCuadrants = safeOdontogram.isAdult ? [ 1, 4 ] : [ 5, 8 ];
  const rightCuadrants = safeOdontogram.isAdult ? [ 2, 3 ] : [ 6, 7 ];

  return (
    <View style={styles.container} testID="odontogram-container">
      {/* New odontogram action buttons */}
      <View style={styles.actionBtnsContainer}>
        <TouchableOpacity style={[styles.actionBtnShell, safeOdontogram.isAdult && styles.actionBtnShellActive]}>
          <Ionicons name="add" size={FontSize.h5} color={safeOdontogram.isAdult? theme.overMain : theme.pageSubtitle} />
          <Text style={[styles.actionBtnText, safeOdontogram.isAdult && styles.actionBtnTextActive]}>
            {t('odontogram.adult')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnShell, !safeOdontogram.isAdult && styles.actionBtnShellActive]}>
          <Ionicons name="add" size={FontSize.h5} color={safeOdontogram.isAdult? theme.pageSubtitle : theme.overMain} />
          <Text style={[styles.actionBtnText, !safeOdontogram.isAdult && styles.actionBtnTextActive]}>
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
              key={`cuadrant-${cuadrant}`}
              teeth={cuadrantsData[cuadrant] ?? []} 
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
              key={`cuadrant-${cuadrant}`}
              teeth={cuadrantsData[cuadrant] ?? []} 
              isLeftCuadrant = {false}
              isBottomCuadrant = {index === 1}
              selectedTooth={selectedTooth} 
              setSelectedTooth={setSelectedTooth}/>
          ))}
        </View>
      </ScrollView>

      {/* hint */}

    </View>
  );
}