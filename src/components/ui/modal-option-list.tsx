import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

export type ModalOptionProp = {
    name?: any;
    isSelected?: boolean;
    onSelect?: () => void;
    testID?: string;
    label?: string;
};

function ModalOption ({
        name = '',
        isSelected = false,
        onSelect,
        testID,
        label,
    } : Readonly<ModalOptionProp> ) {
    const theme = useTheme()
    const styles = createStyles(theme)

    return (
        <TouchableOpacity
          style={[
            styles.modalOption,
            isSelected && styles.modalOptionSelected,
          ]}
          onPress={onSelect}
          testID={testID}
        >
          <Text
            style={[
              styles.modalOptionText,
              isSelected && styles.modalOptionTextSelected,
            ]}
          >
            {label}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark" size={18} color={theme.logo} />
          )}
        </TouchableOpacity>
    );
}

type ModalOptionListProp = {
    visible: boolean;
    onRequestClose: () => void;
    title: string;
    options: ModalOptionProp[];
    selectedOption: any;
    onSelectOption: (opt: any) => void;
}

export function ModalOptionList({
        visible = false,
        onRequestClose,
        title = '',
        options,
        selectedOption,
        onSelectOption
    } : Readonly<ModalOptionListProp> ) {
    const theme = useTheme()
    const styles = createStyles(theme)


    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose}
        >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={onRequestClose}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{title}</Text>
                {/* Options of the modal */}
                {options.map((opt: any, index: number) => (
                    <ModalOption
                        key={opt.name+index}
                        name={opt.name}
                        isSelected={selectedOption === opt.name}
                        onSelect = {() => {
                            onSelectOption(opt.name);
                            onRequestClose();
                        }}
                        testID = {opt.testID}
                        label = {opt.label}
                    />
                ))}
              </View>
            </TouchableOpacity>
        </Modal>
    );
}

const createStyles = (theme:any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.backgroundElement,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.pageTitle,
    marginBottom: 12,
    fontFamily: 'Open Sans',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionSelected: {
    backgroundColor: theme.accentBackground,
  },
  modalOptionText: {
    fontSize: 14,
    color: theme.fieldLabel,
    fontFamily: 'Open Sans',
  },
  modalOptionTextSelected: {
    color: theme.logo,
    fontWeight: '600',
  },
});