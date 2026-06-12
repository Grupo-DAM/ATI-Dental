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
        {/* --- AGREGA ESTE BLOQUE DESDE AQUÍ --- */}
                <View style={{
                  position: 'absolute',
                  bottom: Platform.OS === 'ios' ? 34 : 12, // Alineación perfecta según plataforma
                  alignSelf: 'center',
                  zIndex: 999,
                }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: colors.main,
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 5,
                      borderColor: colors.background, // Mismo color del menú para simular el recorte
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 5,
                      elevation: 8,
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
                {/* ------------------------------------ */}
      </ThemeProvider>
    </AuthProvider>
  );
}

