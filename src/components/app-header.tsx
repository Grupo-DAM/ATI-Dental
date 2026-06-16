import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export type AppHeaderProps = {
  title?: string;
  onMenuPress?: () => void;
};

export function AppHeader({ title = 'ATI Dental', onMenuPress }: Readonly<AppHeaderProps>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/expo.icon/Assets/logo-dental.svg')}
          style={styles.logo}
          contentFit="contain"
          tintColor="white"
        />
        <Text style={styles.headerTitle}>
          {title}
        </Text>
      </View>
      <TouchableOpacity testID="menu-btn" onPress={onMenuPress} activeOpacity={0.7} style={styles.menuButton}>
        <Ionicons name="menu" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
