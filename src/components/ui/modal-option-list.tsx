import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { createModalOptionListStyles } from '@/constants/styles/global.styles';

export type ModalOptionProp = {
  name?: any;
  isSelected?: boolean;
  onSelect?: () => void;
  testID?: string;
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

function ModalOption({
  name = '',
  isSelected = false,
  onSelect,
  testID,
  label,
  icon,
}: Readonly<ModalOptionProp>) {
  const theme = useTheme();
  const styles = useMemo(() => createModalOptionListStyles(theme), [theme]);

  return (
    <TouchableOpacity
      style={[
        styles.modalOption,
        isSelected && styles.modalOptionSelected,
      ]}
      onPress={onSelect}
      testID={testID}
      activeOpacity={0.7}
    >
      <View style={styles.modalOptionContent}>
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={isSelected ? theme.logo : theme.main}
            style={styles.modalOptionIcon}
            testID={testID ? `${testID}-icon` : undefined}
          />
        ) : null}
        <Text
          style={[
            styles.modalOptionText,
            isSelected && styles.modalOptionTextSelected,
          ]}
        >
          {label}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark" size={18} color={theme.logo} />
      )}
    </TouchableOpacity>
  );
}

export type ModalOptionListProp = {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  options: ModalOptionProp[];
  selectedOption?: any;
  onSelectOption: (opt: any) => void;
  testID?: string;
};

export function ModalOptionList({
  visible = false,
  onRequestClose,
  title = '',
  options,
  selectedOption,
  onSelectOption,
  testID = 'modal-option-list',
}: Readonly<ModalOptionListProp>) {
  const theme = useTheme();
  const styles = useMemo(() => createModalOptionListStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
      testID={testID}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onRequestClose}
        testID="modal-option-overlay"
      >
        <View
          style={styles.modalCard}
          testID="modal-option-card"
        >
          <Text style={styles.modalTitle} testID="modal-option-title">{title}</Text>
          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={true}>
            {options.map((opt: ModalOptionProp, index: number) => (
              <ModalOption
                key={`${opt.name}-${index}`}
                name={opt.name}
                isSelected={selectedOption !== undefined && selectedOption === opt.name}
                onSelect={() => {
                  onRequestClose();
                  onSelectOption(opt.name);
                }}
                testID={opt.testID}
                label={opt.label}
                icon={opt.icon}
              />
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}