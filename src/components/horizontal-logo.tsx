import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createHorizontalLogoStyle } from '@/constants/styles/login.styles'
import { ThemedView } from '@/components/themed-view';

const logoIcon = require('@/assets/icons/logoHorizontal.svg');

export type HorizontalLogoProps = {
  style?: StyleProp<ViewStyle>; // Permite pasarle estilos externos al contenedor si lo necesitas
};

export function HorizontalLogo({ style }: ReadOnly<HorizontalLogoProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createHorizontalLogoStyle(theme), [theme]);

  return (
    <ThemedView style={[styles.container, style]}>
      <Image
        source={logoIcon}
        style={styles.logo}
        contentFit="contain"
      />
    </ThemedView>
  );
}