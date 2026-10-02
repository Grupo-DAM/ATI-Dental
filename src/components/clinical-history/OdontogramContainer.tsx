import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { ALL_TOOTH_STATES, OdontogramData, ToothState, ToothCondition } from '@/types/clinical-record';
import { useDentalPiecesPerCuadrant } from '@/hooks/use-dental-pieces-per-cuadrant';
import { createOdontogramStyles } from '@/constants/styles/patients.style';
import { DentalCuadrant } from '@/components/clinical-history/DentalPiece';
import { FontSize } from '@/constants/theme';
import { VoiceDictationBar } from './VoiceDictationBar';
import { useDentalVoice } from '@/hooks/use-dental-voice';
import { firestore } from '@/config/firebase';
import { useLocalSearchParams } from 'expo-router';

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

const REVERSE_STATE_MAP: Record<string, string> = {
  cavity: 'caries',
  filled: 'obturado',
  missing: 'ausente',
  implant: 'implante',
  root_canal: 'endodoncia',
  fixed_dental_prosthesis: 'protesis_fija',
  retained_root: 'remanente_radicular',
  in_eruption: 'en_erupcion',
  temporal: 'temporal',
};

async function saveOdontogramToFirestore(
  patientId: string,
  isAdult: boolean,
  teethData: Record<number, any>
) {
  if (!patientId) return;

  try {
    const estadoPiezas: Record<string, any> = {};

    Object.entries(teethData).forEach(([num, data]) => {
      const states = data.generalStates || [];
      const mainState = states[0] ? (REVERSE_STATE_MAP[states[0]] || states[0]) : null;

      const caras: Record<string, string> = {};
      if (data.surfacesStates) {
        Object.entries(data.surfacesStates).forEach(([surface, sState]) => {
          caras[surface] = sState === 'caries' ? 'caries' : sState === 'obturado' ? 'obturado' : 'temporal';
        });
      }

      if (mainState || Object.keys(caras).length > 0) {
        estadoPiezas[num] = {
          ...(mainState ? { estado_general: mainState } : {}),
          ...(Object.keys(caras).length > 0 ? { caras } : {}),
        };
      }
    });

    const query = await firestore()
      .collection('odontogramas')
      .where('pacienteId', '==', patientId)
      .get();

    if (!query.empty) {
      const docs = [...query.docs];
      docs.sort((a, b) => {
        const timeA = new Date(a.data().fechaRegistro || 0).getTime();
        const timeB = new Date(b.data().fechaRegistro || 0).getTime();
        return timeB - timeA;
      });
      const docId = docs[0].id;
      await firestore().collection('odontogramas').doc(docId).update({
        estadoPiezas,
        fechaRegistro: new Date().toISOString(),
      });
    } else {
      await firestore().collection('odontogramas').add({
        pacienteId: patientId,
        tipo: isAdult ? 'adulto' : 'infantil',
        fechaRegistro: new Date().toISOString(),
        estadoPiezas,
        notasGeneral: '',
      });
    }
  } catch (error) {
    console.error('[OdontogramContainer] Error guardando en Firebase:', error);
  }
}


export function OdontogramContainer({ odontogram, onToothSelect }: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createOdontogramStyles(theme), [theme]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const safeOdontogram = odontogram || DEFAULT_ODONTOGRAM;
  const { patientId: paramPatientId } = useLocalSearchParams<{ patientId?: string }>();
  const currentPatientId = safeOdontogram.patientId || paramPatientId || '';

  // Estado local reactivo para que los dientes cambien de color con la voz
    const [teethData, setTeethData] = useState<Record<number, any>>(safeOdontogram.teeth || {});

    useEffect(() => {
        if (safeOdontogram.teeth && Object.keys(safeOdontogram.teeth).length > 0) {
          setTeethData(safeOdontogram.teeth);
        }
      }, [safeOdontogram.teeth]);
    // Hook de comandos de voz
    const {
      isListening,
      transcript,
      lastCommand,
      permissionError,
      toggleListening,
    } = useDentalVoice({
      isAdult: safeOdontogram.isAdult ?? true,
      onCommandRecognized: (command) => {
        if (command.success && command.toothNumber && command.state) {
          const num = command.toothNumber;
          const newState = command.state;
          setTeethData((prev) => {
            const currentPiece = prev[num] || { number: num, generalStates: [] };
            // Si el comando es "sano", vaciamos las afecciones
            const updatedStates = newState === 'sano'
              ? []
              : Array.from(new Set([...(currentPiece.generalStates || []), newState as ToothState]));
            // Mapeo de superficie si fue dictada por voz (ej. "oclusal")
            const updatedSurfaces = newState === 'sano'
              ? {}
              : {
                  ...(currentPiece.surfacesStates || {}),
                  ...(command.surface
                    ? { [command.surface]: (newState === 'cavity' ? 'caries' : newState === 'filled' ? 'obturado' : 'temporal') }
                    : {}),
                };

            const updated = {
                ...prev,
                [num]: {
                  ...currentPiece,
                  generalStates: updatedStates,
                  surfacesStates: updatedSurfaces,
                },
              };
              // Guarda automáticamente en Firebase Firestore
              void saveOdontogramToFirestore(
                currentPatientId,
                safeOdontogram.isAdult ?? true,
                updated
              );
            return {
              ...prev,
              [num]: {
                ...currentPiece,
                generalStates: updatedStates,
                surfacesStates: updatedSurfaces,
              },
            };
          });
        }
      },
    });

  const cuadrantsData = useDentalPiecesPerCuadrant(
    safeOdontogram.isAdult ?? true,
    teethData
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
      {/* Barra de Transcripción y Feedback */}
        <VoiceDictationBar
          isListening={isListening}
          transcript={transcript}
          lastCommand={lastCommand}
          permissionError={permissionError}
          onToggleListening={toggleListening}
        />

        {/* BOTÓN FLOTANTE (FAB) IDÉNTICO AL FIGMA
          Desaparece automáticamente cuando hay un diente seleccionado (!selectedTooth) */}
            <TouchableOpacity
              testID="btn-voice-dictation"
              activeOpacity={0.85}
              onPress={toggleListening}
              style={[
                fabStyles.fabButton,
                { backgroundColor: isListening ? theme.alert : theme.main },
              ]}
            >
              <Ionicons
                name={isListening ? 'stop' : 'mic'}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
      {/* hint */}

    </View>
  );
}

const fabStyles = StyleSheet.create({
  fabButton: {
    alignSelf: 'flex-end',
    marginRight: 4,
    marginTop: 16,
    marginBottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});