import { StyleSheet } from 'react-native';
import { 
    FontFamily, 
    Spacing, 
    FontWeight,
    Border,
    FontSize,
    LineHeight,
    Icon,
} from '@/constants/theme';

export const createGlobalStyles = (theme: any) => StyleSheet.create({
   text: {
    fontFamily: FontFamily.regular || 'System',
    color: theme.text,
    lineHeight: LineHeight.note,
   }
});

export const createInputFieldStyles = (theme: any) => {
    const global = createGlobalStyles(theme);

    return StyleSheet.create({
        mainContainer: {
            gap: Spacing.one + Spacing.half || 6
        },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: Border.width.regular,
        borderColor: theme.border,
        backgroundColor: theme.backgroundElement,
        borderRadius: Border.radius,
        paddingLeft: Spacing.three || 12,
        paddingRight: Spacing.one,
        marginBottom: Spacing.four || 16,
        height: 50,
    },
    errorContainer: {
        borderColor: theme.error,
        borderWidth: Border.width.bold,
    },
    input: {
        ...global.text,
        flex: Spacing.quarter,
        height: '100%',
        fontSize: FontSize.h4,
        paddingVertical: Spacing.none,
    },
    iconButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',

    },
    icon: {
        margin: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
        width: Icon.size.regular || 20,
        height: '100%',
        resizeMode: 'contain'
    },
    pressed: {
        opacity: 0.6,
    },
    label: {
        ...global.text,
        fontSize: FontSize.h5,
        fontWeight: FontWeight.medium,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    forgotPassword: {
        ...global.text,
        fontWeight: FontWeight.bold,
        color: theme.main,
        fontSize: FontSize.p,
    },
    errorText: {
        ...global.text,
        color: theme.error,
        fontSize: FontSize.p,
        marginBottom: Spacing.three,
        fontWeight: FontWeight.medium,
    }
})};