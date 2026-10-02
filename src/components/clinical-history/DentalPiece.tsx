import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { createDentalPieceStyles, createDentalCuadrantStyles } from '@/constants/styles/patients.style';
import { useToothAsset } from '@/hooks/use-tooth-asset';
import { ToothCondition } from '@/types/clinical-record';
import { useTheme } from '@/hooks/use-theme';

export function getToothCombinedStateColor(theme: any, state: string[]) {
  // in the future could return colors for a combined status component
  // for now returns the first state it finds
  if (state.length === 0) return theme.backgroundElement;
  return theme[state[0]];
}

interface DentalPieceProp {
    readonly tooth: ToothCondition,
    isBottomRow?: boolean,
    isSelected?: boolean,
    showNumber?: boolean,
    containerStyles?: StyleProp<ViewStyle>,
    onPress?: () => void,
}

// Dental piece component
export function DentalPiece({ 
  tooth, isBottomRow = false, isSelected = false, onPress,
  showNumber = true, containerStyles
} : DentalPieceProp) {
  const { dentalPieceSource, flip} = useToothAsset(tooth.number);
  const isHealthy = tooth.generalStates.length === 0;
  const theme = useTheme();
  const styles = useMemo(() => createDentalPieceStyles(theme), [theme])
  const statusColor = useMemo(() => getToothCombinedStateColor(theme, tooth.generalStates), [theme, tooth.generalStates])

  return (
    <View style={[styles.dentalPieceContainer, isBottomRow && styles.bottomDentalPieceContainer, containerStyles]}>
      { showNumber &&
        <View testID="tooth-number-container" 
          style={[styles.numberPieceContainer, isSelected && styles.numberPieceSelectedContainer]}>
          <Text style={[styles.numberPiece, isSelected && styles.numberPieceSelected]}>{tooth.number}</Text>
        </View>
      }
      <Pressable
        testID={`tooth-${tooth.number}`}
        onPress={onPress}
        style={styles.pressable}
      >
        <Image
          source={dentalPieceSource}
          style={[styles.toothAsset, flip && styles.flipToothAsset]}
        />
      </Pressable>
      <View style={[styles.stateDot, isHealthy?(styles.stateDotHealthy):({backgroundColor: statusColor})]}></View>
    </View>
  )
}


interface DentalCuadrantProp {
  teeth: ToothCondition[];
  isLeftCuadrant: boolean;
  isBottomCuadrant: boolean;
  selectedTooth: number | null;
  setSelectedTooth: (toothNumber: number) => void;
}

export function DentalCuadrant({
    teeth, 
    isLeftCuadrant = false, 
    isBottomCuadrant = false, 
    selectedTooth, 
    setSelectedTooth
}:DentalCuadrantProp) {
  const styles = createDentalCuadrantStyles();
  return (
    <View style={[styles.cuadrantRow, isLeftCuadrant && styles.leftCuadrantRow]}>
      {teeth?.map((tooth: ToothCondition)=>(
        <DentalPiece 
            key={tooth.number}
            tooth={tooth} 
            isBottomRow={isBottomCuadrant}
            isSelected={selectedTooth === tooth.number} 
            onPress={() => setSelectedTooth(tooth.number)}/>
      ))}
    </View>
  )
}