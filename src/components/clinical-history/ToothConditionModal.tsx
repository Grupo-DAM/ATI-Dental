import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SlidingModal } from '@/components/ui/sliding-modal';
import { FormActionButton, FormTextField } from '@/components/ui/form-field';
import { useTheme } from '@/hooks/use-theme';
import { createToothConditionModalStyles } from '@/constants/styles/patients.style';
import { ToothCondition } from '@/types/clinical-record';
import { useTranslation } from 'react-i18next';
import { ColorOpacity } from '@/constants/theme';
import { DentalPiece, getToothCombinedStateColor } from './DentalPiece'
import { ALL_TOOTH_STATES, TOOTH_SURFACE, ToothSurface, ToothState } from '@/types/clinical-record';

export interface ToothConditionModalProps {
  visible: boolean;
  tooth?: ToothCondition;
  isSubmitting?: boolean;
  isDestructive?: boolean;
  onConfirm: (updatedTooth: ToothCondition) => void;
  onCancel: () => void;
}

const DEFAULT_TOOTH: ToothCondition = {
    number: 11,
    generalStates: [],
}

function getToothStateColor(theme: any, state: string) {
  return theme[state] || theme.backgroundElement;
}

/** Generic confirmation bottom sheet modal */
export function ToothConditionModal({
  visible,
  tooth,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: Readonly<ToothConditionModalProps>) {
    const { t } = useTranslation();
    const theme = useTheme();
    const modalStyles = useMemo(() => createToothConditionModalStyles(theme), [theme]);

    const [localGeneralStates, setLocalGeneralStates] = useState<ToothState[]>([]);
    const [localSurfaces, setLocalSurfaces] = useState<Required<ToothCondition>['surfacesStates']>({});
    const [localNotes, setLocalNotes] = useState<string>('');
    const [selectedSurface, setSelectedSurface] = useState<ToothSurface | null>(null);

    const safeTooth = tooth || DEFAULT_TOOTH;

    const toggleGeneralState = (state: ToothState) => {
      setLocalGeneralStates((prev) => 
        prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]
      );
    };

    const handleSurfaceStateSelect = (state: 'cavity' | 'filled' | 'temporal') => {
      if (!selectedSurface) return;
      setLocalSurfaces((prev) => ({
        ...prev,
        [selectedSurface]: prev[selectedSurface] === state ? undefined : state,
      }));
    };

    const handleSave = () => {
      onConfirm({
        ...safeTooth,
        generalStates: localGeneralStates,
        surfacesStates: Object.keys(localSurfaces).length > 0 ? localSurfaces : undefined,
        notes: localNotes.trim() === '' ? undefined : localNotes,
      });
    };

    const previewTooth: ToothCondition = useMemo(() => ({
      number: safeTooth.number,
      generalStates: localGeneralStates,
      surfacesStates: localSurfaces,
      notes: localNotes
    }), [safeTooth.number, localGeneralStates, localSurfaces, localNotes]);

  return (
    <SlidingModal
        visible={visible}
        isSubmitting={isSubmitting}
        onCancel={onCancel}
        innerContainerStyle={modalStyles.container}
    >
        <View style={modalStyles.horizontalContainer}>
        <View style={modalStyles.dentalPieceSection}>
            <Text style={modalStyles.pieceNumberText}>
                {safeTooth.number}
            </Text>
            <Text style={modalStyles.dentalPieceSectionText}>
                {t('odontogram.toothConditionModal.selectedPiece')}
            </Text>
                {/* Dental Piece Madness */}
            <DentalPiece
                tooth={previewTooth}
                showNumber={false}
                containerStyles={[
                    modalStyles.dentalPieceContainer, 
                    previewTooth.generalStates.length !== 0 && {
                        backgroundColor: getToothCombinedStateColor(theme, previewTooth.generalStates)+ColorOpacity.hexa.half, 
                        borderColor: getToothCombinedStateColor(theme, previewTooth.generalStates)
                    }
                ]} 
            />
        </View>
        <View style={modalStyles.stateSection}>        
            {/* 1. Mapeo de Estados Generales del Diente */}
            <View>
                <Text style={modalStyles.label}>
                    {t('odontogram.toothConditionModal.state')}
                </Text>
                <View style={modalStyles.buttonGroupRow}>
                    {ALL_TOOTH_STATES.map((state) => {
                        const isActive = localGeneralStates.includes(state);
                        const stateColor = getToothStateColor(theme, state);
                        return (
                        <TouchableOpacity
                            key={state}
                            onPress={() => toggleGeneralState(state)}
                            style={[
                                modalStyles.stateButton,
                                isActive && {backgroundColor: stateColor + ColorOpacity.hexa.low, 
                                borderColor: stateColor}
                            ]}
                        >
                            <View style={[modalStyles.legendDot, { backgroundColor: stateColor }]} />
                            <Text style={[modalStyles.stateButtonText]}>
                            {t(`odontogram.toothStatus.${state}`)}
                            </Text>
                        </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
        </View>

        {/* 2. Mapeo de Superficies Dentales (Caras) */}
        <View>
            <Text style={modalStyles.label}>
                {t('odontogram.toothConditionModal.dentalSurface')}
            </Text>
            <View style={modalStyles.buttonGroupRow}>
                {TOOTH_SURFACE.map((surface) => {
                    const isCurrent = selectedSurface === surface;
                    const surfaceState = localSurfaces[surface];
                    return (
                    <TouchableOpacity
                        key={surface}
                        onPress={() => setSelectedSurface(isCurrent ? null : surface)}
                        style={[
                        modalStyles.stateButton,
                        isCurrent && { backgroundColor: theme.main, borderColor: theme.main },
                        !isCurrent && surfaceState && { backgroundColor: getToothStateColor(theme, surfaceState) + ColorOpacity.hexa.low, 
                            borderColor: getToothStateColor(theme, surfaceState) }
                        ]}
                    >
                        <Text style={[
                        modalStyles.stateButtonText, 
                        isCurrent && { color: theme.overMain },
                        ]}>
                        {t(`odontogram.surfaces.${surface}`, surface)}
                        </Text>
                    </TouchableOpacity>
                    );
                })}
            </View>
        </View>

        {/* 3. Botones de estado específico para la Cara Seleccionada */}
        {selectedSurface && (
            <View style={modalStyles.surfaceStateSelectorBox}>
            <Text style={modalStyles.tinyLabel}>
                {t('odontogram.toothConditionModal.applyToSurface', { surface: t(`odontogram.surfaces.${selectedSurface}`) })}
            </Text>
            <View style={modalStyles.buttonGroupRow}>
                {(['cavity', 'filled', 'temporal'] as const).map((state) => {
                const isActive = localSurfaces[selectedSurface] === state;
                return (
                    <TouchableOpacity
                    key={state}
                    onPress={() => handleSurfaceStateSelect(state)}
                    style={[
                        modalStyles.stateButton,
                        isActive && { backgroundColor: getToothStateColor(theme, state) + ColorOpacity.hexa.low, 
                            borderColor: getToothStateColor(theme, state) }
                    ]}
                    >
                    <Text style={[modalStyles.stateButtonText]}>
                        {t(`odontogram.toothStatus.${state}`)}
                    </Text>
                    </TouchableOpacity>
                );
                })}
            </View>
            </View>
        )}

        <FormTextField
            testID="input-allergies"
            label={t('odontogram.toothConditionModal.notes')}
            value={tooth?.notes}
            placeholder={t('odontogram.toothConditionModal.notesPlaceholder')}
            multiline
            textAlignVertical="top"
        />
            
        <FormActionButton
            label={t('odontogram.toothConditionModal.saveChange')}
            variant='primary'
            onPress={handleSave}
        />
            
        
    </SlidingModal>
  );
}