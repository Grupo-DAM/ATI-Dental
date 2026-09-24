import { createResponsibleCardStyles } from '@/constants/styles/contact.styles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { Text, TouchableOpacity, View } from 'react-native';

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
            { backgroundColor: isOnline ? '#22C55E' : '#9CA3AF' },
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
            <Ionicons name="mail" size={18} color="#4A4A4A" />
          </TouchableOpacity>
          <TouchableOpacity
            testID="btn-quick-phone"
            activeOpacity={0.7}
            onPress={onPhonePress}
            style={styles.circleButton}
          >
            <Ionicons name="call" size={18} color="#4A4A4A" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
