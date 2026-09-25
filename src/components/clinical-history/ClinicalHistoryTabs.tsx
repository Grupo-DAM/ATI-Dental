import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ClinicalTab } from '@/hooks/use-clinical-record';

interface Props {
  readonly activeTab: ClinicalTab;
  readonly onTabChange: (tab: ClinicalTab) => void;
}

export function ClinicalHistoryTabs({ activeTab, onTabChange }: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const tabs: Array<{
    key: ClinicalTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      key: 'consultas',
      label: t('clinicalHistory.tabs.consultations', 'Consultas'),
      icon: 'calendar-outline',
    },
    {
      key: 'odontograma',
      label: t('clinicalHistory.tabs.odontogram', 'Odontograma'),
      icon: 'medkit-outline',
    },
    {
      key: 'tratamientos',
      label: t('clinicalHistory.tabs.treatments', 'Tratamientos'),
      icon: 'clipboard-outline',
    },
  ];

  const isDark = theme.background === '#000000';
  const activeColor = isDark ? '#FFFFFF' : theme.main;

  return (
    <View style={styles.tabsContainer} testID="clinical-history-tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            testID={`tab-${tab.key}`}
            style={[
              styles.tabItem,
              isActive && styles.activeTabItem,
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={isActive ? activeColor : theme.pageSubtitle}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? [styles.activeTabLabel, { color: activeColor }] : styles.inactiveTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    tabsContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardSeparator,
    },
    tabItem: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 4,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTabItem: {
      borderBottomColor: theme.main,
      backgroundColor: theme.accentBackground,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tabLabel: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    activeTabLabel: {
      color: theme.main,
    },
    inactiveTabLabel: {
      color: theme.pageSubtitle,
    },
  });
