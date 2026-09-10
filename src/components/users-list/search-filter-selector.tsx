import { useTranslation } from 'react-i18next';
import React, { useMemo, useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { View, Text, Platform, StyleSheet, TextInput, Pressable} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { DropdownSelector } from '@/components/ui/dropdown-selector.tsx';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SearchIcon = require('@/assets/icons/search.svg');

type ListType = {
    general?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onChangeOrder: (text: string) => void;
};

export function SearchFilter({general= true, value='', onChangeText, onChangeOrder}: ListType) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

    const [option, setOption] = useState<int>(0);

    const orderByOptions = useMemo(() => {
       return general
           ? [
               t('admin-users.orderByName'),
               t('admin-users.orderByLastName'),
               t('admin-users.orderByID')
             ]
           : [
               t('admin-users.orderByName'),
               t('admin-users.orderByLastName'),
               t('admin-users.orderByID'),
               t('patients-list.orderByLastVisit'),
               t('patients-list.orderByNextVisit')
             ];
    }, [general, t]);

    const changeOrder = (indx: int) => {
        if (indx == 0) {
            onChangeOrder('name')
        } else if (indx == 1) {
            onChangeOrder('lastname')
        } else if (indx == 2){
            onChangeOrder('id')
        } else if (indx == 3) {
            onChangeOrder('lastVisit')
        } else if (indx == 4) {
            onChangeOrder('nextVisit')
        }
    }

    return (
        <View style = {styles.filterContainer}>
          <View style = {styles.searchContainer}>
              <Text style = {styles.filterLabels}>
                {general ? t('admin-users.searchUsers') : t('patients-list.searchPatients')}
              </Text>
              <View style = {styles.inputContainer}>
                  <Image
                      source={SearchIcon}
                      contentFit="contain"
                      style={styles.icon}
                    />
                  <TextInput
                      placeholder={t('admin-users.searchUserPlaceholder')}
                      placeholderTextColor= {theme.placeholderColor}
                      style={styles.input}
                      value = {value}
                      onChangeText = {onChangeText}
                    />
              </View>
          </View>
          <View style = {styles.orderByContainer}>
              <Text style = {styles.filterLabels}>
                  {t('admin-users.orderBy')}
              </Text>
              <DropdownSelector
                children = {orderByOptions}
                onChangeOption = {changeOrder}
              ></DropdownSelector>
          </View>
          <Pressable>

          </Pressable>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterLabels: {
        color: theme.textNames,
        fontWeight: '600',
        fontSize: 12,
        lineHeight: 20,
        fontFamily: 'Open Sans',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.backgroundElement,
        borderRadius: 8,
        paddingLeft: Spacing.two || 6,
        paddingRight: 4,
        height: 28,
    },
    searchContainer: {
        width: '70%',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 12,
        paddingVertical: 0,
        color: theme.text,
        fontFamily: Fonts.regular || 'System'
    },
    icon: {
        margin: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
        tintColor: theme.placeholderColor,
        height: 12,
        width: 12
    },
    orderByContainer: {
        width: '25%',
    }
});