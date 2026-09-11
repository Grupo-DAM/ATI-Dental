import { useTranslation } from 'react-i18next';
import React, { useMemo, useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { View, Text, Platform, StyleSheet, TextInput, Pressable} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { DropdownSelector } from '@/components/ui/dropdown-selector.tsx';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { USER_ROLES, getRoleLabelKey, type AppUserRole } from '@/constants/user-roles';

const SearchIcon = require('@/assets/icons/search.svg');
const FilterIcon = require('@/assets/icons/filter-list.svg');
const PlusIcon = require('@/assets/expo.icon/Assets/plus-solid.svg')

type SelectableOptionProp = {
    option: string;
    isSelected: boolean;
    onPress: () => void;
};

export function SelectableOption({option = '', isSelected = false, onPress}: SelectableOptionProp) {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable style = {[styles.filterOptionBtn, isSelected && styles.filterOptionBtnActive]}
            onPress={onPress}>
            <Text style = {styles.filterLabels}>
                {option}
            </Text>
            {isSelected && <Image
                source = {PlusIcon}
                style = {styles.xIcon}
            />}
        </Pressable>

    );
};

type FilterOption = {
    db_value: string;
    name: string;
    active: boolean;
}

type FilterCategoryProp = {
    title: string;
    options: FilterOption[];
    onToggleOption: (optionName: string) => void;
}

export function FilterCategory({title = '', options, onToggleOption}: FilterCategoryProp) {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <View style = {styles.filterCategory}>
            <Text style = {styles.filterCategoryLabel}>{title}</Text>
            {options.map((opt: FilterOption, index: number) => (
                <SelectableOption
                    key = {opt.name || index}
                    option = {opt.name}
                    isSelected = {opt.active}
                    onPress = {() => onToggleOption(opt.db_value)}
                />
            ))}
        </View>

    );
}

type ListType = {
    general?: boolean;
    value: string;
    onChangeText: (text: string) => void;
    onChangeOrder: (text: string) => void;
    activeRoles: string[];
    activeStatus: string[];
    onToggleFilter: (categoryTitle: string, optionName: string) => void;
};

export function SearchFilter({general= true, value='', onChangeText, onChangeOrder,
    activeRoles = [], activeStatus = [], onToggleFilter}: ListType) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

    const [option, setOption] = useState<int>(0);
    const [selectFilters, setSelectFilters] = useState<boolean>(false);

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

    const filterCategoriesAdmin: FilterCategoryProp[] = [
        {
            title: t('admin-users.filterByRole'),
            options: Object.values(USER_ROLES).map((role: AppUserRole) => ({
                 db_value: role,
                 name: t(getRoleLabelKey(role)),
                 active: activeRoles.includes(role),
             })),
            onToggleOption: (optionName) => onToggleFilter('rol', optionName)
        },
        {
            title: t('admin-users.filterByStatus'),
            options: [
                {db_value:'activo', name: t('admin-users.activeStatus'), active: activeStatus.includes('activo')},
                {db_value:'inactivo', name: t('admin-users.inactiveStatus'), active: activeStatus.includes('inactivo')},
            ],
            onToggleOption: (optionName) => onToggleFilter('estado', optionName)
        }
    ]

    const changeOrder = (indx: int) => {
        if (indx === 0) onChangeOrder('name')
        else if (indx === 1) onChangeOrder('lastname')
        else if (indx === 2) onChangeOrder('id')
        else if (indx === 3) onChangeOrder('lastVisit')
        else if (indx === 4) onChangeOrder('nextVisit')
    }

    return (
        <View style = {styles.container}>
          <View style = {styles.mainContainer}>
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
              <Pressable
                testID="filter-toggle-btn"
                style = {({ pressed }) => [styles.filterBtn, pressed && styles.pressedFilterBtn,
                  selectFilters && styles.filterBtnActive]}
                onPress = {() => setSelectFilters(!selectFilters)}>
                <Image
                    source = {FilterIcon}
                    contentFit="contain"
                    style={[styles.filterIcon, selectFilters && {tintColor: Colors.dark.logo}]}
                />
              </Pressable>
          </View>
          {/* Expanded filter section should accommodate patient specific filters too*/}
          {selectFilters &&
              <View style = {styles.filtersContainer}>
                <Text style = {styles.filterLabels}>{t('admin-users.filters')}</Text>
                <View style = {styles.filterColumns}>
                    {filterCategoriesAdmin.map((category:FilterCategoryProp, index: number) => (
                        <FilterCategory
                            key = {index}
                            title = {category.title}
                            options = {category.options}
                            onToggleOption={category.onToggleOption}
                        />
                    ))}
                </View>
              </View>
          }
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    mainContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
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
        width: '60%',
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
    },
    filterBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 32,
        marginTop: 8
    },
    pressedFilterBtn: {
        backgroundColor: theme.backgroundSelected
    },
    filterBtnActive: {
        backgroundColor: theme.main
    },
    filterIcon: {
        width: 24,
        height: 24,
        tintColor: theme.breadcrumbSeparator,
    },
    filtersContainer: {
        gap: Spacing.one
    },
    filterColumns: {
        flexDirection: 'row',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three
    },
    filterCategory: {
        width: '40%',
        gap: Spacing.one
    },
    filterCategoryLabel: {
        color: theme.textNames,
        fontWeight: '800',
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Open Sans',
    },
    filterOptionBtn: {
        marginLeft: Spacing.two,
        paddingHorizontal: Spacing.two,
        height: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.border
    },
    filterOptionBtnActive: {
        backgroundColor: theme.backgroundElement,
    },
    xIcon: {
        height: 12,
        width: 12,
        tintColor: theme.textNames,

        transform: [{rotate: '45deg'}]
    }
});