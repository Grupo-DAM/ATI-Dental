import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

export type NavigationMenuIconKey =
  | 'patients'
  | 'register'
  | 'profile'
  | 'contact'
  | 'admin';

type NavigationMenuIconSlotProps = {
  iconKey: NavigationMenuIconKey;
  source?: number;
  /** Sustituye el icono por defecto (Image, Svg, etc.). */
  children?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Reserva espacio fijo (24×24) para el icono del menú.
 */
export function NavigationMenuIconSlot({
  iconKey,
  source,
  children,
  style,
}: Readonly<NavigationMenuIconSlotProps>) {
  const icon = children ?? (
    source ? (
      <Image
        source={source}
        style={styles.icon}
        contentFit="contain"
        tintColor="#FFFFFF"
      />
    ) : null
  );

  return (
    <View
      testID={`nav-icon-slot-${iconKey}`}
      style={[styles.slot, style]}
      accessibilityElementsHidden={!icon}
      importantForAccessibility={icon ? 'auto' : 'no-hide-descendants'}>
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
