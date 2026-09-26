import { StyleSheet, Platform } from 'react-native';
import { 
    Spacing, 
    FontWeight,
    LineHeight, 
    Border, 
    FontSize,
    Icon,
    BottomTabInset,
    FontFamily
} from '@/constants/theme';
import { createGlobalStyles } from './global.styles';

export const createStyles = (theme:any) => {
    const global = createGlobalStyles(theme)
    return StyleSheet.create({
    container: {
        ...global.screen
    },
    scrollContent: {
        paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: theme.pageTitle, // Ebony Clay
        fontFamily: FontFamily.regular,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: theme.pageSubtitle, // Pale Sky
        lineHeight: 20,
        fontFamily: FontFamily.regular,
    },
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.offlineBannerBackground,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        marginHorizontal: Spacing.three,
        marginBottom: Spacing.three,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.offlineBannerBorder,
    },
    offlineText: {
        fontSize: 12,
        color: theme.offlineBannerText,
        fontFamily: FontFamily.regular,
        fontWeight: FontWeight.semibold,
    },
    sectionContainer: {
        backgroundColor: theme.backgroundSecondary,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: Border.radius.regular,
        marginHorizontal: Spacing.three,
        marginBottom: Spacing.three,
        padding: Spacing.three,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.three,
    },
    sectionIcon: {
        marginRight: Spacing.two,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: FontWeight.semibold,
        color: theme.reportValueText,
        fontFamily: FontFamily.regular,
    },
    responsiblesList: {
        gap: 12,
    },
    directContactSubtitle: {
        fontSize: 12,
        color: theme.textNames,
        fontFamily: FontFamily.regular,
        marginBottom: Spacing.three,
        textAlign: 'center',
    },
    buttonGroup: {
        gap: 12,
        alignItems: 'center',
    },
    socialSubfeed: {
        marginTop: Spacing.two,
        marginBottom: Spacing.three,
    },
    socialChannelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        borderRadius: Border.radius.regular,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialName: {
        fontSize: 15,
        fontWeight: FontWeight.semibold,
        color: theme.pageTitle,
        fontFamily: FontFamily.regular,
    },
    socialTag: {
        fontSize: 12,
        color: theme.pageSubtitle,
        fontFamily: FontFamily.regular,
    },
    instagramScroll: {
        flexDirection: 'row',
    },
    instagramCard: {
        width: 200,
        backgroundColor: theme.backgroundElement,
        borderRadius: Border.radius.regular,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 12,
        overflow: 'hidden',
    },
    instagramImage: {
        width: '100%',
        height: 120,
    },
    instagramContent: {
        padding: 10,
    },
    instagramPostTitle: {
        fontSize: 13,
        fontWeight: FontWeight.bold,
        color: theme.textNames,
        fontFamily: FontFamily.regular,
    },
    instagramPostDesc: {
        fontSize: 11,
        color: theme.pageSubtitle,
        fontFamily: FontFamily.regular,
        lineHeight: 14,
        marginVertical: 4,
    },
    instagramPostTime: {
        fontSize: 10,
        color: theme.breadcrumbSeparator,
        fontFamily: FontFamily.regular,
    },
    facebookList: {
        gap: 12,
    },
    facebookCard: {
        backgroundColor: theme.backgroundElement,
        borderRadius: Border.radius.regular,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 12,
    },
    facebookCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    facebookAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    facebookAuthor: {
        fontSize: 14,
        fontWeight: FontWeight.semibold,
        color: theme.textNames,
        fontFamily: FontFamily.regular,
    },
    facebookTime: {
        fontSize: 11,
        color: theme.breadcrumbSeparator,
        fontFamily: FontFamily.regular,
    },
    facebookText: {
        fontSize: 13,
        color: theme.pageTitle,
        fontFamily: FontFamily.regular,
        lineHeight: 18,
        marginBottom: 10,
    },
    facebookActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        paddingTop: Spacing.two,
    },
    facebookActionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
    },
    facebookActionText: {
        fontSize: 12,
        fontWeight: FontWeight.semibold,
        color: '#65676B',
        fontFamily: FontFamily.regular,
    },
})};

export const createResponsibleCardStyles = (theme: any) => {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundElement,
    borderTopWidth: 4,
    borderTopColor: theme.main,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: Border.width.bold,
    borderColor: theme.pfpBorderColor,
  },
  statusDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: theme.main,
    fontFamily: FontFamily.regular,
  },
  role: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: '#3E1F5C', // Grape
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: theme.textNames, // Tundora
    fontFamily: FontFamily.regular,
    lineHeight: 16,
    marginVertical: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.pfpBorderColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
})};

export const createEditResponsibleCardStyles = (theme: any) => {
    return StyleSheet.create({
      card: {
        backgroundColor: theme.backgroundElement,
        borderRadius: 12,
        padding: Spacing.three,
        paddingVertical: Spacing.five,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.three,
      },
      photoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
      avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 12,
        borderWidth: Border.width.bold,
        backgroundColor: theme.pfpBorderColor,
      },
      photoInfo: { flex: 1 },
      photoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.pageTitle,
        fontFamily: FontFamily.regular,
        marginBottom: 4,
      },
      photoActions: { flexDirection: 'row', marginBottom: 4 },
      changeBtn: {
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: 4,
        paddingHorizontal: Spacing.two,
        paddingVertical: 3,
        marginRight: 10,
      },
      changeTxt: { fontSize: 11, color: theme.fieldLabel, fontFamily: FontFamily.regular },
      deleteTxt: { fontSize: 11, color: theme.alert, fontFamily: FontFamily.regular, paddingVertical: 3 },
      photoHint: { fontSize: 10, color: theme.placeholderColor, fontFamily: FontFamily.regular },
      trashBtn: { padding: 4 },
      row: { flexDirection: 'row', marginBottom: 12 },
      col: {},
      label: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.fieldLabel,
        fontFamily: FontFamily.regular,
        marginBottom: 5,
      },
      input: {
        height: 40,
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: Border.radius.regular,
        paddingHorizontal: 10,
        fontSize: 13,
        fontFamily: FontFamily.regular,
        color: theme.pageTitle,
        backgroundColor: theme.backgroundElement,
      },
      textarea: {
        height: 72,
        paddingTop: 10,
        textAlignVertical: 'top',
        marginBottom: 12,
      },
      iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: Border.radius.regular,
        paddingHorizontal: 10,
        height: 40,
        backgroundColor: theme.backgroundElement,
        marginBottom: 10,
      },
      rowIcon: { marginRight: Spacing.two },
      iconInput: { flex: 1, fontSize: 13, color: theme.pageTitle, fontFamily: FontFamily.regular },
    });
};

export const createUpdateContactInfoStyles = (theme: any) => {
    return StyleSheet.create({
      container: { flex: 1, backgroundColor: theme.background },
      centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
      loadingText: { color: theme.pageSubtitle, fontFamily: FontFamily.regular, fontSize: 13 },
      scrollContent: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
      titleSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
      mainTitle: {
        fontSize: 22, fontWeight: FontWeight.bold, color: theme.pageTitle,
        fontFamily: FontFamily.regular, marginBottom: 4,
      },
      subtitle: { fontSize: 13, color: theme.pageSubtitle, lineHeight: 18, fontFamily: FontFamily.regular },
      
    sectionContainer: {
        gap: Spacing.four,
        marginBottom: Spacing.four,
    },
      sectionHeaderRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
        marginHorizontal: Spacing.three, marginBottom: 12,
      },
      sectionTitle: {
        fontSize: 17, fontWeight: FontWeight.semibold, color: theme.reportValueText, fontFamily: FontFamily.regular,
      },
      emptyBox: {
        marginHorizontal: Spacing.three, marginBottom: Spacing.three,
        padding: 20, backgroundColor: theme.pfpBorderColor,
        borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.cardSeparator,
        alignItems: 'center',
      },
      emptyText: { color: theme.pageSubtitle, fontFamily: FontFamily.regular, textAlign: 'center' },
      card: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.five,
        gap: Spacing.three,
      },
      cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 18 },
      buttonRow: {
        flexDirection: 'row', justifyContent: 'flex-end',
        alignItems: 'center', gap: 10,
        marginTop: Spacing.two, marginHorizontal: Spacing.three, marginBottom: 24,
      },
      btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 44, borderRadius: 8, paddingHorizontal: Spacing.three, minWidth: 110,
      },
      btnCancel: { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.cardSeparator },
      btnCancelText: { color: theme.fieldLabel, fontSize: 14, fontWeight: FontWeight.semibold, fontFamily: FontFamily.regular },
      btnSave: { backgroundColor: theme.main, minWidth: 160 },
      btnDisabled: { opacity: 0.6 },
      btnSaveText: { color: theme.overMain, fontSize: 14, fontWeight: FontWeight.semibold, fontFamily: FontFamily.regular },
    })
};

export const createFormFieldStyles = (theme: any) => {
    const global = createGlobalStyles(theme);
    return StyleSheet.create({
        wrapper: { marginBottom: 14 },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.two,
        },
        rowError: { borderColor: theme.error, borderWidth: 1.5 },
        iconBox: {
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 4,
            borderRadius: Border.radius.regular,
            ...global.shadow,
        },
        input: {
            flex: Spacing.quarter,
            height: 38,
            paddingHorizontal: 10,
            paddingVertical: 0,
            fontSize: 14,
            fontFamily: FontFamily.regular,
            color: theme.pageTitle,
            justifyContent: 'center',
            borderWidth: Border.width.regular,
            borderColor: theme.cardSeparator,
            borderRadius: Border.radius.regular, // is 6 in figma but will use the standar 8 that's used everywhere else
            backgroundColor: theme.backgroundElement,
        },
        errorText: {
            marginTop: 4,
            marginLeft: 2,
            fontSize: 11,
            color: theme.error,
            fontFamily: FontFamily.regular,
        },
    });
};