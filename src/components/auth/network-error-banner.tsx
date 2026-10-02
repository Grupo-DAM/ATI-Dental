import React from 'react';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/constants/styles/auth.styles';

const WarningIcon = require('@/assets/icons/warning.svg');

interface NetworkErrorBannerProps {
  title: string;
  message: string;
}

export const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({ title, message }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <ThemedView style={styles.errorPopup}>
      <Image source={WarningIcon} style={[styles.icon, styles.warningIcon]} />
      <ThemedView style={{ width: '90%', backgroundColor: theme.errorBackground }}>
        <ThemedText style={styles.popupTitle}>{title}</ThemedText>
        <ThemedText style={[styles.label, { color: theme.error, textAlign: 'left' }]}>
          {message}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};