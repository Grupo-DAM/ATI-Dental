import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ResponsibleCardProps = {
  name: string;
  role: string;
  description: string;
  imageUrl: any;
  isOnline: boolean;
  onEmailPress: () => void;
  onPhonePress: () => void;
};

export function ResponsibleCard({
  name,
  role,
  description,
  imageUrl,
  isOnline,
  onEmailPress,
  onPhonePress,
}: Readonly<ResponsibleCardProps>) {
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
        <Text style={styles.name}>{name}</Text>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 4,
    borderTopColor: '#5B2D8B',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  statusDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B2D8B',
    fontFamily: 'Open Sans',
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E1F5C', // Grape
    fontFamily: 'Open Sans',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: '#4A4A4A', // Tundora
    fontFamily: 'Open Sans',
    lineHeight: 16,
    marginVertical: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
