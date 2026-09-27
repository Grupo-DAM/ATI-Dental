import { Spacing, Colors, FontFamily} from "@/constants/theme";
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

export const createRegisterTreatmentStyles = (theme: any) => {
    return StyleSheet.create({
      loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
      container: { flex: 1, backgroundColor: theme.background },
      scrollContent: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
      titleSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
      mainTitle: {
        fontSize: 22, fontWeight: '700', color: theme.pageTitle,
        fontFamily: 'Open Sans', marginBottom: 4,
      },
      subtitle: { fontSize: 13, color: theme.pageSubtitle, lineHeight: 18, fontFamily: FontFamily.regular },
    
      card: {
        backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.cardSeparator,
        borderRadius: 12, marginHorizontal: 16, marginBottom: 16, padding: 16,
        shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      },
    
      examItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.accentBackground,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 10,
      },
      examName: {
        fontSize: 13, fontWeight: '600', color: Colors.light.main,
        fontFamily: 'Open Sans',
      },
      examDate: {
        fontSize: 11, color: theme.pageSubtitle, fontFamily: FontFamily.regular, marginTop: 2,
      },
      addBtnContainer: { alignItems: 'center', marginTop: 4 },
      addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.main,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 4,
      },
      addBtnText: {
        color: theme.overMain, fontSize: 13, fontWeight: '600', fontFamily: 'Open Sans',
      },
    
      buttonRow: {
        flexDirection: 'row', justifyContent: 'center',
        alignItems: 'center', gap: 12,
        marginTop: 8, marginHorizontal: 16, marginBottom: 24,
      },
      btn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 44, borderRadius: 8, paddingHorizontal: 20,
      },
      btnCancel: {
        backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: theme.cardSeparator, minWidth: 110,
      },
      btnCancelText: { color: theme.fieldLabel, fontSize: 14, fontWeight: '600', fontFamily: 'Open Sans' },
      btnSave: { backgroundColor: Colors.light.main, minWidth: 180 },
      btnSaveText: { color: theme.overMain, fontSize: 14, fontWeight: '600', fontFamily: 'Open Sans' },
      btnSaveSubmitting: { opacity: 0.7 },
      btnSaveIcon: { marginRight: 8 }
    });
};

export const createInputStyles = (theme: any) => {
    return StyleSheet.create({
      fieldGroup: { marginBottom: 14 },
      label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.fieldLabel,
        fontFamily: 'Open Sans',
        marginBottom: 6,
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: 8,
        backgroundColor: theme.backgroundElement,
        height: 44,
        paddingHorizontal: 12,
      },
      input: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Open Sans',
        color: theme.pageTitle,
        height: '100%',
      },
      prefix: {
        fontSize: 14,
        fontFamily: 'Open Sans',
        color: theme.pageSubtitle,
        marginRight: 4,
      },
      placeholder: { color: theme.placeholderColor },
      selectTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: 8,
        backgroundColor: theme.backgroundElement,
        height: 44,
        paddingHorizontal: 12,
      },
      selectText: {
        fontSize: 14,
        fontFamily: 'Open Sans',
        color: theme.pageTitle,
        flex: 1,
      },
      optionsList: {
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        borderRadius: 8,
        backgroundColor: theme.backgroundElement,
        marginTop: 4,
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.pfpBorderColor,
      },
      optionItemSelected: {
        backgroundColor: theme.accentBackground,
      },
      optionText: {
        fontSize: 14,
        fontFamily: 'Open Sans',
        color: theme.fieldLabel,
      },
      optionTextSelected: {
        color: theme.logo,
        fontWeight: '600',
      },
      errorBorder: {
        borderColor: theme.error,
      },
      errorText: {
        fontSize: 12,
        color: theme.error,
        fontFamily: 'Open Sans',
        marginTop: 4,
      },
      scrollView: {
        maxHeight: 180
      },
      multiLine: {
        textAlignVertical: 'top', paddingTop: 10 
      },
      icon: {
        marginRight: 4
      }
    });
};

export const createPatientCardStyles = (theme: any) => {
    return StyleSheet.create({
        card: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.header,
            borderRadius: 12,
            marginHorizontal: 16,
            marginBottom: 16,
            padding: 16,
        },
        avatar: {
            width: 64,
            height: 64,
            borderRadius: 32,
            marginRight: 14,
            backgroundColor: theme.overMain,
            borderWidth: 2,
            borderColor: theme.overMain,
        },
        info: { flex: 1 },
        name: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.overMain,
            fontFamily: 'Open Sans',
            marginBottom: 2,
        },
        details: {
            fontSize: 12,
            color: theme.overMain,
            fontFamily: 'Open Sans',
            marginBottom: 6,
        },
        phoneRow: { flexDirection: 'row', alignItems: 'center' },
        phone: {
            fontSize: 13,
            color: theme.overMain,
            fontFamily: 'Open Sans',
        },
        phoneIcon: {
            marginRight: 6 
        }
    });
};

export const createSectionStyles = (theme: any) => {
    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        },
        title: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.logo,
            fontFamily: 'Open Sans',
        },
    });     
};

//esto deberia ser una modificacion al componente de breadcrum
//pero una cosa a la vez
export const createBreadCrumbStyle = (theme: any) => {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.backgroundElement,
            borderBottomWidth: 1,
            borderBottomColor: theme.pageSeparator,
        },
        parentText: {
            color: theme.pageSubtitle,
            fontSize: 14,
            fontFamily: 'Open Sans',
        },
        chevron: {
            color: theme.breadcrumbSeparator,
            fontSize: 14,
        },
        currentText: {
            color: theme.main,
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Open Sans',
        },
    });
};