import React, { useMemo } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createSectionCardStyles } from '@/constants/styles/global.styles';

export interface SectionCardProps {
  /** Title of the card section */
  title: string;
  /** Icon displayed to the left of the title */
  icon?: React.ReactNode;
  /** Inner content of the card */
  children: React.ReactNode;
  /** Whether to add top spacing before the card (for non-first sections) */
  cardSpacing?: boolean;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Optional testID for testing */
  testID?: string;
  /** Optional element rendered on the right side of the header */
  headerRight?: React.ReactNode;
}

export function SectionCard({
  title,
  icon,
  children,
  cardSpacing = false,
  style,
  testID,
  headerRight,
}: Readonly<SectionCardProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createSectionCardStyles(theme), [theme]);

  return (
    <View
      testID={testID}
      style={[styles.cardContainer, cardSpacing ? styles.cardSpacing : null, style]}
    >
      <View style={styles.cardHeader}>
        {icon ? <View style={styles.cardHeaderIcon}>{icon}</View> : null}
        <Text style={styles.cardHeaderTitle}>{title}</Text>
        {headerRight}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}
