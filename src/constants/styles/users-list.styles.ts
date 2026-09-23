// Hoja de estilos
import { StyleSheet } from 'react-native';
import { FontFamily, Spacing, FontWeight } from '@/constants/theme';

export const createListStyles = (theme: any) => StyleSheet.create({
  scrollContent: {
    flexGrow: Spacing.quarter || 1,
  },
  container: {
    flex: Spacing.quarter || 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: theme.pageTitle, // Ebony Clay
    fontFamily: FontFamily.regular || 'System',
    marginBottom: Spacing.oneHalf || 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.pageSubtitle, // Pale Sky
    lineHeight: 20,
    fontFamily: FontFamily.regular || 'System',
  },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.two,
        paddingHorizontal: Spacing.three,
        marginBottom: Spacing.three,
    },
    filterLabels: {
        color: theme.textNames,
        fontWeight: 600,
        fontSize: 12,
        lineHeight: 20,
        fontFamily: FontFamily.regular || 'System',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: Spacing.quarter,
        borderColor: theme.border,
        backgroundColor: theme.backgroundElement,
        borderRadius: Spacing.two,
        paddingLeft: Spacing.two || 6,
        paddingRight: Spacing.one,
        height: 28,
    },
    searchContainer: {
        width: '70%',
    },
    input: {
        flex: Spacing.quarter,
        height: '100%',
        fontSize: 12,
        paddingVertical: Spacing.none,
        color: theme.text,
        fontFamily: FontFamily.regular || 'System'
    },
    icon: {
        margin: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
        tintColor: theme.placeholderColor
    },
    orderByContainer: {
        width: '25%',
    },
});