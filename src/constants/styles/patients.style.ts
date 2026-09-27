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
