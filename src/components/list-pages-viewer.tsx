import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, Image, TextInput, Pressable} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PageButtonProps = {
  theme: any;
  styles: any;
  selected: boolean;
  symbol: boolean;
  left: boolean;
  onPress: () => void;
  children: React.ReactNode; // Pass page number dynamically
};

function PageButton({ theme, styles, selected, symbol, left, onPress, children }: PageButtonProps) {
  return (
    /* FIXED: Rest styles first, then override with selected styles */
    <Pressable
        style={[styles.pageBtn, selected && styles.pageBtnSelected]}
        onPress = {onPress}>
      {symbol ? (
          <View style = {left && styles.changePageSymbol}>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={14}
              weight="bold"
              tintColor = {theme.pageSubtitle}

            />
          </View>
          ) : (
          <Text style={[styles.text, selected && styles.btnTextSelected]}>
            {children}
          </Text>
      )}
    </Pressable>
  );
}

type SearchResults = {
    total?: int;
    minRange?: int;
    maxRange?: int;
    currentPage?: int;
    totalPages?: int;
    onPageChange: (page: number) => void;
};

export function ListPages({
    total= 0,
    maxRange= 0,
    minRange= 0,
    currentPage= 0,
    totalPages= 0,
    onPageChange }: SearchResults) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

     const getFirstBtnPage = () => {
        if (totalPages > 3 && currentPage > 2) {
            return currentPage - 1;
        }
        return 1;
     };

     const getSecondBtnPage = () => {
        if (currentPage === 1) return 2;
        if (currentPage === totalPages) return totalPages - 1;
        return currentPage;
     };

     const getThirdBtnPage = () => {
        if (totalPages > 3 && currentPage <= totalPages - 2) {
            return currentPage + 1;
        }
        return totalPages;
     };

    return (
        <View style = {styles.spacer}>
        <View style = {styles.container}>
            <View style = {styles.textContainer}>
                <Text style = {styles.text}>{t('admin-users.searchResult', {
                        min: minRange,
                        max: maxRange,
                        total: total
                })}</Text>
            </View>
            <View style = {styles.btnContainer}>
                {(totalPages > 0) && (
                    <PageButton
                        theme = {theme} styles={styles} selected={currentPage == 1}
                        symbol = {totalPages > 3 && currentPage > 2} left = {true}
                        onPress={() => onPageChange(getFirstBtnPage())}>
                        {(totalPages <= 3 || currentPage <= 2) && 1}
                    </PageButton>
                )}
                {(totalPages > 1) && (
                    <PageButton
                        theme = {theme} styles={styles}
                        selected={(currentPage > 1 && currentPage < totalPages) ||
                            (currentPage == totalPages && totalPages == 2)}
                        symbol = {false}
                        onPress={() => onPageChange(getSecondBtnPage())}>
                        {(currentPage == 1 || totalPages == 2) && 2}
                        {(currentPage == totalPages && totalPages > 2) && (totalPages - 1)}
                        {(currentPage > 1 && currentPage < totalPages) && currentPage}
                    </PageButton>
                )}
                {(totalPages > 2) && (
                    <PageButton
                        theme = {theme} styles={styles} selected={currentPage == totalPages}
                        symbol = {totalPages > 3 && currentPage <= totalPages - 2} left = {false}
                        onPress={() => onPageChange(getThirdBtnPage())}>
                        {(totalPages <= 3 || currentPage > totalPages - 2) && totalPages}
                    </PageButton>
                )}
            </View>
        </View>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    spacer: {
        marginTop: 'auto'
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: theme.backgroundSecondary,
        borderColor: theme.backgroundSelected,
        borderTopWidth: 1,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginTop: 32
    },
    textContainer: {
        alignContent: 'center'
    },
    btnContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.one
    },
    pageBtn: {
        width: 42,
        height: 42,
        backgroundColor: theme.backgroundElement,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderColor: theme.cardSeparator,
        borderWidth: 1
    },
    pageBtnSelected: {
        backgroundColor: theme.main,
        borderColor: theme.main
    },
    text: {
        color: theme.pageSubtitle,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '400'
    },
    btnTextSelected: {
        color: 'white'
    },
    changePageSymbol: {
       transform: [{rotate: '180deg'}]
    },
});