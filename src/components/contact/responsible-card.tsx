import { 
  createResponsibleCardStyles, 
  createEditResponsibleCardStyles 
} from '@/constants/styles/contact.styles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { CardContainer } from '@/components/ui/card-container';
import { Text, TouchableOpacity, View, TextInput, } from 'react-native';

// ─── Sub-components ───────────────────────────────────────────────────────────
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

export interface Responsible {
  id: string;
  title?: string;
  name?: string;
  role?: string;
  description?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

export type ResponsibleCardProps = {
  title?: string;
  name: string;
  role: string;
  description: string;
  imageUrl: any;
  isOnline: boolean;
  onEmailPress: () => void;
  onPhonePress: () => void;
};

export function ResponsibleCard({
  title,
  name,
  role,
  description,
  imageUrl,
  isOnline,
  onEmailPress,
  onPhonePress,
}: Readonly<ResponsibleCardProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createResponsibleCardStyles(theme), [theme]);
  return (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        <Image source={imageUrl} style={styles.avatar} contentFit="cover" />
        <View
          testID={`status-${isOnline ? 'online' : 'offline'}`}
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? theme.onlineStatus : theme.breadcrumbSeparator },
          ]}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.name}>
          {title ? `${title}. ${name}` : name}
        </Text>
        <Text style={styles.role}>{role}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            testID="btn-quick-email"
            activeOpacity={0.7}
            onPress={onEmailPress}
            style={styles.circleButton}
          >
            <Ionicons name="mail" size={18} color={theme.textNames} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-quick-phone"
            activeOpacity={0.7}
            onPress={onPhonePress}
            style={styles.circleButton}
          >
            <Ionicons name="call" size={18} color={theme.textNames} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function EditResponsibleCard({
  resp,
  index,
  onChange,
  onClear,
  t,
}: {
  resp: Responsible;
  index: number;
  onChange: (index: number, field: keyof Responsible, value: string) => void;
  onClear: (index: number) => void;
  t: (key: string) => string;
}) {
  const theme = useTheme();
  const cardStyles = useMemo(() => createEditResponsibleCardStyles(theme), [theme]);

  return (
    <CardContainer cardStyle={cardStyles.card}>
        {/* Header: photo + trash */}
        <View style={cardStyles.header}>
          <View style={cardStyles.photoRow}>
            <Image
              source={resp.imageUrl ? { uri: resp.imageUrl } : avatarFallback}
              style={cardStyles.avatar}
              contentFit="cover"
            />
            <View style={cardStyles.photoInfo}>
              <Text style={cardStyles.photoLabel}>{t('updateContact.photoLabel')}</Text>
              <View style={cardStyles.photoActions}>
                <TouchableOpacity style={cardStyles.changeBtn}>
                  <Text style={cardStyles.changeTxt}>{t('updateContact.change')}</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={cardStyles.deleteTxt}>{t('updateContact.delete')}</Text>
                </TouchableOpacity>
              </View>
              <Text style={cardStyles.photoHint}>{t('updateContact.photoHint')}</Text>
            </View>
          </View>
          <TouchableOpacity style={cardStyles.trashBtn} onPress={() => onClear(index)}>
            <Ionicons name="trash-outline" size={20} color={theme.alert} />
          </TouchableOpacity>
        </View>

        {/* Título + Nombre in same row */}
        <View style={cardStyles.row}>
          <View style={[cardStyles.col, { flex: 0.35 }]}>
            <Text style={cardStyles.label}>{t('updateContact.fieldTitle')}</Text>
            <TextInput
              style={cardStyles.input}
              value={resp.title || ''}
              onChangeText={(v) => onChange(index, 'title', v)}
              placeholder={t('updateContact.placeholderTitle')}
              placeholderTextColor={theme.placeholderColor}
            />
          </View>
          <View style={[cardStyles.col, { flex: 0.65, marginLeft: 10 }]}>
            <Text style={cardStyles.label}>{t('updateContact.fieldName')}</Text>
            <TextInput
              style={cardStyles.input}
              value={resp.name || ''}
              onChangeText={(v) => onChange(index, 'name', v)}
              placeholder={t('updateContact.placeholderName')}
              placeholderTextColor={theme.placeholderColor}
            />
          </View>
        </View>

        {/* Cargo */}
        <Text style={cardStyles.label}>{t('updateContact.fieldRole')}</Text>
        <TextInput
          style={[cardStyles.input, { marginBottom: 12 }]}
          value={resp.role || ''}
          onChangeText={(v) => onChange(index, 'role', v)}
          placeholder={t('updateContact.placeholderRole')}
          placeholderTextColor={theme.placeholderColor}
        />

        {/* Descripción */}
        <Text style={cardStyles.label}>{t('updateContact.fieldDescription')}</Text>
        <TextInput
          style={[cardStyles.input, cardStyles.textarea]}
          value={resp.description || ''}
          onChangeText={(v) => onChange(index, 'description', v)}
          placeholder={t('updateContact.placeholderDescription')}
          placeholderTextColor={theme.placeholderColor}
          multiline
          numberOfLines={3}
        />

        {/* Email row */}
        <View style={cardStyles.iconRow}>
          <Ionicons name="mail-outline" size={18} color="#6B7280" style={cardStyles.rowIcon} />
          <TextInput
            style={cardStyles.iconInput}
            value={resp.email || ''}
            onChangeText={(v) => onChange(index, 'email', v)}
            placeholder={t('updateContact.placeholderEmail')}
            placeholderTextColor={theme.placeholderColor}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone row */}
        <View style={[cardStyles.iconRow, { marginBottom: 0 }]}>
          <Ionicons name="call-outline" size={18} color="#6B7280" style={cardStyles.rowIcon} />
          <TextInput
            style={cardStyles.iconInput}
            value={resp.phone || ''}
            onChangeText={(v) => onChange(index, 'phone', v)}
            placeholder={t('updateContact.placeholderPhone')}
            placeholderTextColor={theme.placeholderColor}
            keyboardType="phone-pad"
          />
        </View>
    

    </CardContainer>
  );
}
