import { StyleSheet, Platform } from 'react-native';
import { 
    FontFamily, 
    Spacing, 
    FontWeight,
    Border,
    FontSize,
    LineHeight,
    Icon,
    LetterSpacing,
    BottomTabInset
} from '@/constants/theme';

export const createGlobalStyles = (theme: any) => StyleSheet.create({
    text: {
      fontFamily: FontFamily.regular || 'System',
      color: theme.text,
      lineHeight: LineHeight.note,
    },
    screen: {
      flex: Spacing.quarter,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: Spacing.quarter,
    },
    scrollContent: {
      flexGrow: Spacing.quarter || 1,
      paddingBottom: BottomTabInset + 40,
    },
    titleSection: {
      gap: Spacing.oneHalf || 6,
      padding: Spacing.threeHalf,
      paddingBottom: Spacing.none,
      marginBottom: Spacing.threeHalf
    },
    mainTitle: {
      fontSize: FontSize.h2,
      fontWeight: FontWeight.bold,
      color: theme.pageTitle,
      fontFamily: FontFamily.regular || 'System',
      lineHeight: LineHeight.pageTitle,
    },
    subtitle: {
      fontSize: FontSize.h5,
      fontWeight: FontWeight.regular,
      color: theme.pageSubtitle,
      fontFamily: FontFamily.regular || 'System',
      lineHeight: LineHeight.pageSubtitle,
    },
    shadow: {
      shadowColor: theme.shadowColor,
      shadowOffset: { width: 0, height:4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
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
        borderRadius: Border.radius.regular,
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

export const createTabBarStyles = (theme: any) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: Platform.OS === 'ios' ? 76 : Spacing.six,
    paddingTop: Spacing.two + Spacing.one,
    borderTopWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: Spacing.quarter,
  },
  floatingButtonContainer: {
    width: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingButton: {
    position: 'absolute',
    top: -50,
    width: 58,
    height: 58,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: Spacing.none, height: Spacing.one },
    shadowOpacity: 0.15,
    shadowRadius: Spacing.one + Spacing.quarter,
    elevation: Spacing.two,
  },
  icon: {
    width: Icon.size.big,
    height: Icon.size.big,
    marginBottom: Spacing.one,
  },
  plusIcon: {
    width: Icon.size.small,
    height: Icon.size.small,
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
  },
});

export const createAppHeaderStyles = (theme: any) => StyleSheet.create({
  header: {
    backgroundColor: theme.header,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: Icon.size.headerLogo,
    height: Icon.size.headerLogo,
  },
  headerTitle: {
    color: 'white',
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.half,
  },
  menuButton: {
    padding: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const createCardContainerStyles = (theme: any) => {
  const global = createGlobalStyles(theme);

  return StyleSheet.create({
    cardWrapper: {
      flex: 1,
      paddingTop: Spacing.two,
      borderRadius: 12,
      backgroundColor: theme.main,
      ...global.shadow,
    },
    card: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      padding: Border.radius.wide,
    }
  })
};

export const createFormFieldStyles = (theme: any) => {

  return StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textNames,
      marginTop: 15,
      marginBottom: 8,
    },
    requiredMark: {
      color: theme.error,
      fontWeight: '700',
    },
    inputShell: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      minHeight: 46,
      justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textAreaShell: {
      minHeight: 90,
      alignItems: 'flex-start',
    },
    inputError: {
      borderColor: theme.error,
      borderWidth: 1.5,
    },
    input: {
      flex: 1,
      height: 46,
      fontSize: 15,
      color: theme.fieldLabel,
      padding: 0,
    },
    textAreaInput: {
      height: 90,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    selectText: {
      flex: 1,
      fontSize: 15,
      color: theme.fieldLabel,
    },
    selectPlaceholder: {
      color: theme.placeholderColor,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 6,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    submitIcon: {
      marginRight: 8,
    },
    primaryButtonText: {
      color: theme.overMain,
      fontWeight: '600',
      fontSize: 15,
    },
    secondaryButtonText: {
      color: theme.textNames,
      fontWeight: '600',
      fontSize: 15,
    },
  });
}