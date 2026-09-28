import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useNavigationMenu } from '@/hooks/use-navigation-menu';
import { createAppHeaderStyles } from '@/constants/styles/global.styles';

export type AppHeaderProps = {
  title?: string;
  onMenuPress?: () => void;
};

export function AppHeader({ title = 'ATI Dental', onMenuPress }: Readonly<AppHeaderProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAppHeaderStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigationMenu = useNavigationMenu();

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }

    if (navigationMenu) {
      navigationMenu.open();
      return;
    }

    router.push('/contacts');
  };

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
      <TouchableOpacity testID="menu-btn" onPress={handleMenuPress} activeOpacity={0.7} style={styles.menuButton}>
        <Ionicons name="menu" size={36} color="white" />
      </TouchableOpacity>
    </View>
  );
}