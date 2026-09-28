import React, { useMemo } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { HorizontalLogo } from '@/components/horizontal-logo';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/constants/styles/auth.styles';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  titleTestID?: string;
  topContent?: React.ReactNode; // Banner u otros elementos superiores
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  titleTestID,
  topContent,
  children,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ThemedView style={styles.container}>
      {/* Se renderiza primero para aparecer arriba del logo y título */}
      {topContent}

      <ThemedView style={styles.titleContainer}>
        <HorizontalLogo />
        <ThemedText testID={titleTestID} style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </ThemedView>

      {children}
    </ThemedView>
  );
};