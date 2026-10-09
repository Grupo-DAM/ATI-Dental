import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from 'react-i18next';

export interface InfoTooltipProps {
  title: string;
  description: string;
  calculationNote?: string;
  testID?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  closeButtonText?: string;
}

export function InfoTooltip({
  title,
  description,
  calculationNote,
  testID,
  iconName = 'information-circle-outline',
  iconSize = 12,
  iconColor,
  closeButtonText,
}: Readonly<InfoTooltipProps>) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const resolvedCloseText = closeButtonText ?? t('reports.tooltipClose', 'Entendido');

  return (
    <>
      <Pressable
        testID={testID}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={description}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.trigger}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={iconColor ?? theme.breadcrumbSeparator}
        />
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        testID={testID ? `${testID}-modal` : 'info-tooltip-modal'}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setVisible(false)}
          testID={testID ? `${testID}-backdrop` : 'info-tooltip-backdrop'}
          accessibilityRole="button"
          accessibilityLabel={resolvedCloseText}
        >
          <Pressable
            style={styles.card}
            onPress={(e) => e.stopPropagation()}
            testID={testID ? `${testID}-content` : 'info-tooltip-content'}
          >
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="information-circle" size={20} color={theme.logo} />
              </View>
              <Text
                style={styles.title}
                testID={testID ? `${testID}-title` : 'info-tooltip-title'}
              >
                {title}
              </Text>
            </View>

            <Text
              style={styles.description}
              testID={testID ? `${testID}-description` : 'info-tooltip-description'}
            >
              {description}
            </Text>

            {calculationNote ? (
              <View
                style={styles.noteBox}
                testID={testID ? `${testID}-note` : 'info-tooltip-note'}
              >
                <Text style={styles.noteText}>{calculationNote}</Text>
              </View>
            ) : null}

            <Pressable
              style={styles.closeButton}
              onPress={() => setVisible(false)}
              testID={testID ? `${testID}-close-button` : 'info-tooltip-close-button'}
              accessibilityRole="button"
              accessibilityLabel={resolvedCloseText}
            >
              <Text style={styles.closeButtonText}>{resolvedCloseText}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    trigger: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.accentBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    description: {
      fontSize: 13,
      lineHeight: 19,
      color: theme.textSecondary,
      fontFamily: 'Open Sans',
      marginBottom: 12,
    },
    noteBox: {
      backgroundColor: theme.accentBackground,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 16,
    },
    noteText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.accentText,
      fontFamily: 'Open Sans',
    },
    closeButton: {
      backgroundColor: theme.main,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    closeButtonText: {
      color: theme.overMain,
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
  });
