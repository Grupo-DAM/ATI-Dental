// src/components/horizontal-logo.tsx
import React from 'react';
import { StyleSheet, Image, ViewStyle, StyleProp } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';

const logoIcon = require('@/assets/icons/logoHorizontal.png');

export type HorizontalLogoProps = {
  style?: StyleProp<ViewStyle>; // Permite pasarle estilos externos al contenedor si lo necesitas
};

export function HorizontalLogo({ style }: HorizontalLogoProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ThemedView style={[styles.container, style]}>
      <Image
        source={logoIcon}
        style={[
          { tintColor: theme.logo }
        ]}
      />
    </ThemedView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
    },
});