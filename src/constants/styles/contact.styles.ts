import { StyleSheet, Platform } from 'react-native';
import { 
    Spacing, 
    FontWeight,
    LineHeight, 
    Border, 
    FontSize,
    Icon,
    BottomTabInset
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
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.offlineBannerBackground,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.offlineBannerBorder,
    },
    offlineText: {
        fontSize: 12,
        color: theme.offlineBannerText,
        fontFamily: 'Open Sans',
        fontWeight: '600',
    },
    sectionContainer: {
        backgroundColor: theme.backgroundSecondary,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionIcon: {
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.reportValueText,
        fontFamily: 'Open Sans',
    },
    responsiblesList: {
        gap: 12,
    },
    directContactSubtitle: {
        fontSize: 12,
        color: theme.textNames,
        fontFamily: 'Open Sans',
        marginBottom: 16,
        textAlign: 'center',
    },
    buttonGroup: {
        gap: 12,
        alignItems: 'center',
    },
    socialSubfeed: {
        marginTop: 8,
        marginBottom: 16,
    },
    socialChannelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.pageTitle,
        fontFamily: 'Open Sans',
    },
    socialTag: {
        fontSize: 12,
        color: theme.pageSubtitle,
        fontFamily: 'Open Sans',
    },
    instagramScroll: {
        flexDirection: 'row',
    },
    instagramCard: {
        width: 200,
        backgroundColor: theme.backgroundElement,
        borderRadius: 8,
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
        fontWeight: '700',
        color: theme.textNames,
        fontFamily: 'Open Sans',
    },
    instagramPostDesc: {
        fontSize: 11,
        color: theme.pageSubtitle,
        fontFamily: 'Open Sans',
        lineHeight: 14,
        marginVertical: 4,
    },
    instagramPostTime: {
        fontSize: 10,
        color: theme.breadcrumbSeparator,
        fontFamily: 'Open Sans',
    },
    facebookList: {
        gap: 12,
    },
    facebookCard: {
        backgroundColor: theme.backgroundElement,
        borderRadius: 8,
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
        fontWeight: '600',
        color: theme.textNames,
        fontFamily: 'Open Sans',
    },
    facebookTime: {
        fontSize: 11,
        color: theme.breadcrumbSeparator,
        fontFamily: 'Open Sans',
    },
    facebookText: {
        fontSize: 13,
        color: theme.pageTitle,
        fontFamily: 'Open Sans',
        lineHeight: 18,
        marginBottom: 10,
    },
    facebookActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        paddingTop: 8,
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
        fontWeight: '600',
        color: '#65676B',
        fontFamily: 'Open Sans',
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
    padding: 16,
    gap: 16,
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
    borderWidth: 2,
    borderColor: '#F3F4F6',
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
    fontWeight: '700',
    color: theme.main,
    fontFamily: 'Open Sans',
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E1F5C', // Grape
    fontFamily: 'Open Sans',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: theme.textNames, // Tundora
    fontFamily: 'Open Sans',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
})};