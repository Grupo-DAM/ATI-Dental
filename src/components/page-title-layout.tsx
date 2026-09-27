import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme'
import { View, Text, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { createGlobalStyles } from '@/constants/styles/global.styles';

interface PageTitleLayoutProps {
    titleKey: string;
    subtitleKey: string;
    parentBreadcrumbKey: string;
    currentBreadcrumbKey: string;
    children?: React.ReactNode;
    modals?: React.ReactNode;
    testID?: string;
    scrollContainerStyle?: StyleProp<ViewStyle>
}

export function PageTitleLayout({
    titleKey,
    subtitleKey,
    parentBreadcrumbKey,
    currentBreadcrumbKey,
    children,
    modals,
    testID,
    scrollContainerStyle,
}: PageTitleLayoutProps) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = useMemo(() => createGlobalStyles(theme), [theme]);
    return (
        <View testID={testID} style={styles.screen}>
            <AppHeader />
            <Breadcrumb 
                parent={t(parentBreadcrumbKey)} 
                current={t(currentBreadcrumbKey)}
            />

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, scrollContainerStyle]}
                showsVerticalScrollIndicator={false}    
            >
                    
                {/* Sección Título */}
                <View style={styles.titleSection}>
                    <Text style={styles.mainTitle}>{t(titleKey)}</Text>
                    <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
                </View>

                {children}
            </ScrollView>
            {modals}
        </View>
    )
}