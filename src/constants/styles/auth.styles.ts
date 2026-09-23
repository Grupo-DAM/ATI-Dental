import { StyleSheet } from 'react-native';
import { 
    Spacing, 
    FontWeight,
    LineHeight, 
    Border, 
    FontSize,
    Icon,
} from '@/constants/theme';
import { createGlobalStyles } from './global.styles';

export const createAuthStyles = (theme: any) => {
    const global = createGlobalStyles(theme);

    return StyleSheet.create({
        container: {
            flex: Spacing.quarter,
            justifyContent: 'center',
            padding: Spacing.three + Spacing.one, // 20px
            gap: Spacing.five,
        },
        titleContainer: {
            gap: Spacing.two,
        },
        title: {
            ...global.text,
            textAlign: 'center',
            fontSize: FontSize.h1,
            lineHeight: LineHeight.loginTitle,
            fontWeight: FontWeight.bold,
        },
        subtitle: {
            ...global.text,
            textAlign: 'center',
            color: theme.accentText,
            lineHeight: LineHeight.loginSubtitle,
            fontSize: FontSize.h4,
            fontWeight: FontWeight.regular,
        },
        socialMediaBtns: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: Spacing.three,
        },
        socialMediaBtn: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: Spacing.two,
            borderWidth: Border.width.regular,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
            borderRadius: Border.radius,
            paddingHorizontal: Spacing.three,
            height: 50,
            width: '40%',
        },
        icon: {
            justifyContent: 'center',
            alignItems: 'center',
            width: Icon.size.regular,
            height: '100%',
            resizeMode: 'contain',
        },
        button: {
            backgroundColor: theme.main,
            borderRadius: Border.radius,
            justifyContent: 'center',
            alignItems: 'center',
            height: 48,
            marginTop: Spacing.two,
            marginBottom: Spacing.three,
        },
        buttonPressed: {
            opacity: 0.8,
        },
        buttonText: {
            color: theme.overMain,
            fontSize: FontSize.h4,
            fontWeight: FontWeight.semibold,
        },
        labelContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: Spacing.two,
        },
        label: {
            color: theme.accentText,
            fontSize: FontSize.h5,
            fontWeight: FontWeight.regular,
            textAlign: 'center',
        },
        signInLink: {
            color: theme.main,
            fontSize: FontSize.h5,
            fontWeight: FontWeight.bold,
        },
        errorText: {
            color: theme.error,
            fontSize: FontSize.p,
            textAlign: 'center',
            marginBottom: Spacing.three,
        },
        errorPopup: {
            borderRadius: Border.radius,
            borderWidth: Border.width.regular,
            borderColor: theme.error,
            padding: Spacing.three,
            flexDirection: 'row',
            gap: Spacing.two + Spacing.one, // 12px
            backgroundColor: theme.errorBackground,
        },
        popupTitle: {
            color: theme.error,
            fontSize: 18,
            fontWeight: FontWeight.bold,
        },
        warningIcon: {
            marginTop: Spacing.two,
            height: Icon.size.regular,
        },
        successText: {
            color: theme.success || '#2e7d32', // Falls back to theme.success if defined
            fontSize: FontSize.h4,
            fontWeight: FontWeight.bold,
            marginTop: Spacing.two,
            textAlign: 'center',
        },
    });
};

// Aliases para mantener compatibilidad hacia atrás si tus componentes aún importan createStyles
export const createStyles = createAuthStyles;
export const createRegisterStyles = createAuthStyles;

// Configuración y función de estilos para el Logo Horizontal
const ORIGINAL_WIDTH_HORIZONTAL_LOGO = 225;
const ORIGINAL_HEIGHT_HORIZONTAL_LOGO = 25;
const ASPECT_RATIO_HORIZONTAL_LOGO = ORIGINAL_WIDTH_HORIZONTAL_LOGO / ORIGINAL_HEIGHT_HORIZONTAL_LOGO;

export const createHorizontalLogoStyle = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    logo: {
        width: '100%',
        aspectRatio: ASPECT_RATIO_HORIZONTAL_LOGO,
        tintColor: theme.logo,
    },
});