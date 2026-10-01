import { StyleSheet, Platform } from "react-native";

export const createAgendaStyles = (theme: any) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        center: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        centerPadding: {
            paddingVertical: 48,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerContainer: {
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
        },
        monthYearText: {
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 4,
            color: theme.textSecondary,
        },
        titleRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        agendaTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: theme.text,
        },
        navButtonsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        navButton: {
            width: 32,
            height: 32,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        daySelectorContainer: {
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 10,
            justifyContent: 'space-between',
        },
        dayCard: {
            flex: 1,
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 2,
            marginHorizontal: 3,
            borderRadius: 12,
            borderWidth: 1,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            ...Platform.select({
                ios: {
                    shadowColor: theme.shadowColor,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                },
                android: {
                    elevation: 1,
                },
            }),
        },
        dayCardSelected: {
            borderColor: theme.main,
        },
        dayNameText: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 6,
            color: theme.textSecondary,
        },
        dayNameTextSelected: {
            color: theme.main,
        },
        dayNumberContainer: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        dayNumberContainerSelected: {
            backgroundColor: theme.main,
            borderRadius: 14,
        },
        dayNumberText: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
        },
        dayNumberTextSelected: {
            color: theme.overMain,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 90,
        },
        timelineContainer: {
            paddingTop: 4,
        },
        timelineRow: {
            flexDirection: 'row',
            marginBottom: 16,
        },
        timeColumn: {
            width: 60,
            alignItems: 'center',
            paddingTop: 4,
            position: 'relative',
        },
        timeText: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.text,
        },
        timeTextSecondary: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.textSecondary,
        },
        periodText: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 6,
            color: theme.textSecondary,
        },
        timelineMarker: {
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: theme.main,
            backgroundColor: theme.backgroundElement,
            marginTop: 2,
            zIndex: 1
        },
        timelineMarkerSecondary: {
            width: 10,
            height: 10,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: theme.cardSeparator,
            backgroundColor: theme.backgroundElement,
            marginTop: 2,
            zIndex: 1
        },
        timelineLine: {
            position: 'absolute',
            top: 50,
            bottom: -16,
            width: 2,
            backgroundColor: theme.cardSeparator,
            zIndex: 0
        },
        appointmentCard: {
            flex: 1,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.backgroundElement,
            padding: 14,
            marginLeft: 8,
            ...Platform.select({
                ios: {
                    shadowColor: theme.shadowColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 2,
                },
            }),
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        patientName: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.text,
        },
        menuIconButton: {
            padding: 4,
        },
        treatmentRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        treatmentIcon: {
            marginRight: 6,
        },
        treatmentName: {
            fontSize: 13,
            color: theme.textSecondary,
        },
        badgesRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statusBadgeText: {
            color: theme.overMain,
            fontSize: 10,
            fontWeight: '700',
        },
        outlineBadge: {
            borderWidth: 1,
            borderColor: theme.cardSeparator,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
        },
        outlineBadgeText: {
            fontSize: 10,
            fontWeight: '600',
            color: theme.textSecondary,
        },
        lunchBreakCard: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.border,
            backgroundColor: theme.backgroundSecondary,
            paddingVertical: 10,
            marginLeft: 8,
        },
        lunchBreakText: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.8,
            color: theme.textSecondary,
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 48,
            paddingHorizontal: 24,
        },
        emptyIconCircle: {
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            backgroundColor: theme.backgroundSecondary,
        },
        emptyTitle: {
            fontSize: 17,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 6,
            color: theme.text,
        },
        emptySubtitle: {
            fontSize: 14,
            textAlign: 'center',
            color: theme.textSecondary,
        },
        retryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginTop: 16,
            backgroundColor: theme.main,
        },
        retryButtonText: {
            color: theme.overMain,
            fontSize: 14,
            fontWeight: '600',
        },
        accessDeniedContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
        },
        accessDeniedTitle: {
            fontSize: 18,
            fontWeight: '700',
            marginTop: 16,
            marginBottom: 8,
            textAlign: 'center',
        },
        accessDeniedDesc: {
            fontSize: 14,
            textAlign: 'center',
            color: theme.pageSubtitle,
        },
    });
};