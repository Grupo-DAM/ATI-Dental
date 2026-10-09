import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FormFieldLabel } from './form-field';
import { ModalOptionList } from './modal-option-list';
import {
  DOCUMENT_CONFIGS,
  DOCUMENT_TYPE_VALUES,
  DocumentType,
} from '@/constants/patient';
import { useTheme } from '@/hooks/use-theme';

export interface DocumentInputProps {
  label: string;
  required?: boolean;
  documentType: DocumentType | '';
  documentNumber: string;
  onChangeType: (type: DocumentType) => void;
  onChangeNumber: (value: string) => void;
  errorMessage?: string;
  testID?: string;
}

export function DocumentInput({
  label,
  required = false,
  documentType,
  documentNumber,
  onChangeType,
  onChangeNumber,
  errorMessage,
  testID = 'document-input',
}: Readonly<DocumentInputProps>) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isEnabled = Boolean(documentType);
  const currentConfig = documentType ? DOCUMENT_CONFIGS[documentType] : null;

  const handleSelectType = (selected: DocumentType) => {
    onChangeType(selected);
    setModalVisible(false);
    // Auto-focus al input tras seleccionar la opción
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleTextChange = (text: string) => {
    if (!documentType || !currentConfig) return;

    let sanitized = text;
    if (currentConfig.isNumericOnly) {
      sanitized = text.replace(/\D/g, '');
    } else {
      sanitized = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }

    if (sanitized.length > currentConfig.maxLength) {
      sanitized = sanitized.slice(0, currentConfig.maxLength);
    }
    onChangeNumber(sanitized);
  };

  const modalOptions = DOCUMENT_TYPE_VALUES.map((type) => ({
    name: type,
    label: DOCUMENT_CONFIGS[type].label,
    testID: `doc-type-option-${type}`,
  }));

  return (
    <View style={styles.container}>
      <FormFieldLabel label={label} required={required} />

      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: errorMessage ? theme.error : theme.cardSeparator,
          },
        ]}
      >
        {/* Selector de Tipo (V, E, J, P) */}
        <TouchableOpacity
          testID="btn-select-doc-type"
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
          style={[styles.typeButton, { borderRightColor: theme.cardSeparator }]}
        >
          <Text
            style={[
              styles.typeText,
              { color: documentType ? theme.text : theme.placeholderColor },
            ]}
          >
            {documentType || 'Tipo'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={theme.placeholderColor}
            style={styles.chevronIcon}
          />
        </TouchableOpacity>

        {/* Input Numérico / Alfanumérico */}
        <TextInput
          ref={inputRef}
          testID={testID}
          style={[
            styles.input,
            { color: theme.text },
            !isEnabled && { opacity: 0.5 },
          ]}
          editable={isEnabled}
          value={documentNumber}
          onChangeText={handleTextChange}
          placeholder={
            isEnabled
              ? currentConfig?.placeholder
              : 'Seleccione un tipo primero'
          }
          placeholderTextColor={theme.placeholderColor}
          keyboardType={currentConfig?.isNumericOnly ? 'number-pad' : 'default'}
          autoCapitalize="characters"
        />
      </View>

      {errorMessage ? (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {errorMessage}
        </Text>
      ) : null}

      <ModalOptionList
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        title="Tipo de Documento"
        options={modalOptions}
        selectedOption={documentType}
        onSelectOption={handleSelectType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 46,
    overflow: 'hidden',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    height: '100%',
    minWidth: 78,
    justifyContent: 'space-between',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});