import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

export type NavigationMenuIconKey =
  | 'patients'
  | 'register'
  | 'profile'
  | 'contact'
  | 'admin';

type NavigationMenuIconSlotProps = {
  iconKey: NavigationMenuIconKey;
  /** Sustituye el placeholder por tu icono (Image, Svg, etc.). */
  children?: React.ReactNode;
  style?: ViewStyle;
};

/**
 * Reserva espacio fijo (24×24) para el icono del menú.
 * Sustituye `children` cuando tengas los assets listos.
 */
export function NavigationMenuIconSlot({
  iconKey,
  children,
  style,
}: Readonly<NavigationMenuIconSlotProps>) {
  return (
    <View
      testID={`nav-icon-slot-${iconKey}`}
      style={[styles.slot, style]}
      accessibilityElementsHidden={!children}
      importantForAccessibility={children ? 'auto' : 'no-hide-descendants'}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
