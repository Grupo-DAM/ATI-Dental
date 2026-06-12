import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme, View, TouchableOpacity, Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/hooks/use-auth';

import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'unspecified' ? 'light' : colorScheme;
  const colors = Colors[scheme];
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppTabs />
            <View style={{
              position: 'absolute',
              bottom: Platform.OS === 'ios' ? 34 : 12,
              alignSelf: 'center',
              zIndex: 999,
              backgroundColor: colors.main,
              width: 58,
              height: 58,
              borderRadius: 29,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 5,
              elevation: 8,
            }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={require('../../assets/expo.icon/Assets/plus-solid.svg')}
                  style={{ width: 18, height: 18 }}
                  contentFit="contain"
                  tintColor="white"
                />
              </TouchableOpacity>
            </View>
      </ThemeProvider>
    </AuthProvider>
  );
}

