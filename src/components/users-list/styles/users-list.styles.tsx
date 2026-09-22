// Hoja de estilos
import { StyleSheet } from 'react-native';
import { FontFamily, Spacing } from '@/constants/theme';

export const createListStyles = (theme: any) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.pageTitle, // Ebony Clay
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.pageSubtitle, // Pale Sky
    lineHeight: 20,
    fontFamily: 'Open Sans',
  },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterLabels: {
        color: theme.textNames,
        fontWeight: 600,
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