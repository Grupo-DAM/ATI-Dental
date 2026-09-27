import { StyleSheet, Platform } from 'react-native';
import { 
    Spacing, 
    FontWeight,
    Border, 
    FontSize,
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
    directContactSection: {
        padding: Spacing.five,
        paddingTop: Spacing.five,
    },
    directContactHeader: {
        justifyContent: 'center',
    },
    sectionContainer: {
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: theme.pageSeparator,
        borderRadius: Border.radius.regular,
        marginBottom: Spacing.three,
        paddingTop: Spacing.three,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.four,
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
    directContactTitle: {
        fontSize: FontSize.h3,
        fontWeight: FontWeight.bold,
        color: theme.boldAccent,
        fontFamily: FontFamily.regular,
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
        marginHorizontal: Spacing.quarter,
        paddingBottom: Spacing.three,
        ...global.shadow,
        borderRadius: Border.radius.regular,
        backgroundColor: theme.backgroundElement,
    },
    socialChannelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        borderTopLeftRadius: Border.radius.regular,
        borderTopRightRadius: Border.radius.regular,
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
    instagramHeaderText: {
        color: theme.instagramTextColor
    },
    instagramScroll: {
        flexDirection: 'row',
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
    },
    instagramCard: {
        width: 200,
        backgroundColor: theme.backgroundElement,
        borderRadius: Border.radius.regular,
        borderWidth: 1,
        borderColor: theme.cardSeparator,
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
    facebookHeader: {
        backgroundColor: theme.facebookMainColor
    },
    facebookHeaderText: {
        color: theme.facebookTextColor
    },
    facebookList: {
        paddingHorizontal:Spacing.three,
        gap: 12,
    },
    facebookCard: {
        backgroundColor: theme.backgroundSecondary,
        borderRadius: Border.radius.regular,
        borderLeftWidth: Border.width.bold,
        borderColor: theme.facebookMainColor,
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
        borderTopColor: theme.pageSeparator,
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
        color: theme.textSecondary,
        fontFamily: FontFamily.regular,
    },
})};

export const createResponsibleCardStyles = (theme: any) => {
  return StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundElement,
    padding: Spacing.three,
    gap: Spacing.three,
    alignSelf: 'stretch',
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
    borderColor: theme.overMain,
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
    color: theme.boldAccent, // Grape
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