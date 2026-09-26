import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';

interface OfflineBannerProps {
  isRetrying?: boolean;
  onRetry?: () => void;
}

export function OfflineBanner({ isRetrying, onRetry }: Readonly<OfflineBannerProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineMessageContainer}>
        <Ionicons name="cloud-offline-outline" size={16} color={theme.offlineBannerText} style={{ marginRight: 6 }} />
        <Text style={styles.offlineText}>{t('contacts.offlineMode')}</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        onPress={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color={theme.offlineBannerText} />
        ) : (
          <>
            <Ionicons name="refresh-outline" size={14} color={theme.offlineBannerText} style={{ marginRight: 4 }} />
            <Text style={styles.retryButtonText}>{t('common.retry', 'Reintentar')}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.offlineBannerBackground || '#FEF3C7',
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.offlineBannerBorder || '#F59E0B',
    },
    offlineMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    offlineText: {
      fontSize: 12,
      color: theme.offlineBannerText || '#92400E',
      fontFamily: 'Open Sans',
      fontWeight: '600',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(180, 83, 9, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(180, 83, 9, 0.3)',
    },
    retryButtonPressed: {
      opacity: 0.7,
    },
    retryButtonText: {
      fontSize: 12,
      color: '#B45309',
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
});