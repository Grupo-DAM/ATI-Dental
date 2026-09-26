import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

export interface TimelineSearchBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (q: string) => void;
  readonly placeholder: string;
  readonly testID?: string;
}

export function TimelineSearchBar({
  searchQuery,
  onSearchChange,
  placeholder,
  testID,
}: Readonly<TimelineSearchBarProps>) {
  const theme = useTheme();
  const styles = createSearchStyles(theme);

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={16} color={theme.placeholderColor} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={theme.placeholderColor}
        value={searchQuery}
        onChangeText={onSearchChange}
        clearButtonMode="while-editing"
        testID={testID}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => onSearchChange('')}
          style={styles.clearButton}
          testID="btn-clear-search"
        >
          <Ionicons name="close-circle" size={16} color={theme.placeholderColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export interface TimelineItemActionsProps {
  readonly onModify?: () => void;
  readonly onDelete?: () => void;
  readonly modifyTestID?: string;
  readonly deleteTestID?: string;
}

export function TimelineItemActions({
  onModify,
  onDelete,
  modifyTestID,
  deleteTestID,
}: Readonly<TimelineItemActionsProps>) {
  const theme = useTheme();
  const styles = createActionsStyles(theme);

  return (
    <View style={styles.actionsFooter}>
      <TouchableOpacity
        style={styles.actionItem}
        onPress={(e) => {
          e?.stopPropagation?.();
          onModify?.();
        }}
        activeOpacity={0.7}
        testID={modifyTestID}
      >
        <Ionicons name="create-outline" size={14} color={theme.pageSubtitle} />
        <Text style={styles.actionText}>Modificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionItem}
        onPress={(e) => {
          e?.stopPropagation?.();
          onDelete?.();
        }}
        activeOpacity={0.7}
        testID={deleteTestID}
      >
        <Ionicons name="trash-outline" size={14} color={theme.pageSubtitle} />
        <Text style={styles.actionText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

export interface TimelineEmptyStateProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly subtitle: string;
  readonly testID?: string;
}

export function TimelineEmptyState({
  icon,
  title,
  subtitle,
  testID,
}: Readonly<TimelineEmptyStateProps>) {
  const theme = useTheme();
  const styles = createEmptyStyles(theme);

  return (
    <View style={styles.emptyContainer} testID={testID}>
      <Ionicons name={icon} size={48} color={theme.pageSubtitle} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const createSearchStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 40,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      fontFamily: 'Open Sans',
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
    },
  });

const createActionsStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    actionsFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: theme.pageSeparator,
      marginTop: 10,
      paddingTop: 8,
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
  });

const createEmptyStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginTop: 10,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      textAlign: 'center',
      marginTop: 4,
    },
  });
