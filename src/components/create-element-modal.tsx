import React, { useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list';
import {
  CreatableElementOption,
  CreatableElementId,
  ALL_CREATABLE_ELEMENTS,
  getCreatableOptionsForRole,
  isRoleAllowedToCreate,
} from '@/constants/create-element-options';

export interface CreateElementModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption?: (option: CreatableElementOption) => void;
  testID?: string;
}

export function CreateElementModal({
  visible,
  onClose,
  onSelectOption,
  testID = 'create-element-modal',
}: Readonly<CreateElementModalProps>) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const userRole = user?.rol;
  const allowedOptions = useMemo(() => getCreatableOptionsForRole(userRole), [userRole]);

  const handleSelect = (optionId: CreatableElementId) => {
    const option = ALL_CREATABLE_ELEMENTS.find((item) => item.id === optionId);
    if (!option) return;

    // Escenario 4: Intentos de acceso no autorizados
    const isAllowed = isRoleAllowedToCreate(userRole, option.id);
    if (!isAllowed) {
      Alert.alert(
        t('tabs.createModal.accessDeniedTitle', 'Acceso Restringido'),
        t(
          'tabs.createModal.accessDeniedMessage',
          'No posees permisos suficientes para registrar este tipo de elemento.'
        )
      );
      return;
    }

    // ModalOptionList already invokes onRequestClose() upon option selection
    if (onSelectOption) {
      onSelectOption(option);
    } else {
      if (option.params) {
        router?.push({ pathname: option.route as any, params: option.params });
      } else {
        router?.push(option.route as any);
      }
    }
  };

  const modalOptions: ModalOptionProp[] = useMemo(() => {
    return allowedOptions.map((opt) => ({
      name: opt.id,
      label: t(opt.labelKey, opt.defaultLabel),
      icon: opt.icon,
      testID: opt.testID,
    }));
  }, [allowedOptions, t]);

  return (
    <ModalOptionList
      visible={visible}
      onRequestClose={onClose}
      title={t('tabs.createModal.title', 'Crear nuevo elemento')}
      options={modalOptions}
      onSelectOption={(name) => handleSelect(name as CreatableElementId)}
      testID={testID}
    />
  );
}
