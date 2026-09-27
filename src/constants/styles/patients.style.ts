import { Spacing } from "@/constants/theme";
import { StyleSheet, Platform } from "react-native";


export const createClinicalHistoryStyles = (theme: any) => {
    return StyleSheet.create({
        screen: {
        flex: 1,
        backgroundColor: theme.background,
        },
        scrollContent: {
        paddingBottom: Platform.OS === 'ios' ? 100 : 80,
        },
        centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.five,
        },
        stateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.pageTitle,
        fontFamily: 'Open Sans',
        marginTop: 16,
        textAlign: 'center',
        },
        stateMessage: {
        fontSize: 14,
        color: theme.pageSubtitle,
        fontFamily: 'Open Sans',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
        },
        retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        backgroundColor: theme.main,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 10,
        },
        retryButtonText: {
        color: theme.overMain,
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Open Sans',
        },
  });
};

export const createRegisterPatientStyles = (theme: any) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scroll: {
            flex: 1,
        },
        titleSection: {
            paddingHorizontal: 20,
            paddingVertical: 20,
        },
        mainTitle: {
            fontSize: 26,
            fontWeight: '700',
            color: theme.pageTitle,
            marginBottom: 8,
        },
        subtitle: {
            fontSize: 14,
            color: theme.pageSubtitle,
            lineHeight: 20,
        },
        cardContainer: {
            backgroundColor: theme.backgroundElement,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.pageSeparator,
        },
        cardSpacing: {
            marginTop: 20,
        },
        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: theme.pageSeparator,
            backgroundColor: theme.backgroundSecondary,
        },
        cardHeaderIcon: {
            marginRight: 10,
        },
        cardHeaderTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.pageTitle,
        },
        cardBody: {
            padding: 20,
        },
        avatarRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        avatar: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.backgroundSelected,
        },
        avatarActions: {
            flex: 1,
            marginLeft: 16,
        },
        avatarLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.textNames,
            marginBottom: 8,
        },
        avatarButtonsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        btnChange: {
            borderWidth: 1,
            borderColor: theme.cardSeparator,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 6,
            marginRight: 15,
            backgroundColor: theme.backgroundElement,
        },
        btnChangeText: {
            color: theme.textNames,
            fontSize: 14,
        },
        btnRemoveText: {
            color: theme.alert,
            fontSize: 14,
        },
        btnRemoveDisabled: {
            opacity: 0.4,
        },
        avatarHelpText: {
            fontSize: 12,
            color: theme.placeholderColor,
        },
        emailIcon: {
            width: 18,
            height: 18,
            marginRight: 10,
        },
        leadingIcon: {
            marginRight: 10,
        },
        row: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        rowItem: {
            flexGrow: 1,
            flexBasis: 140,
            minWidth: 140,
        },
        rowItemWide: {
            flexGrow: 1.35,
            flexBasis: 160,
            minWidth: 160,
        },
        actions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            marginTop: 30,
            marginBottom: 20,
            paddingHorizontal: 20,
        }
    });
};