import { Spacing, Colors, FontFamily, FontSize, FontWeight, LineHeight, Border, BottomTabInset, ColorOpacity} from "@/constants/theme";
import { StyleSheet, Platform } from "react-native";
import { createGlobalStyles } from "./global.styles";


export const createClinicalHistoryStyles = (theme: any) => {
    const global = createGlobalStyles(theme);
    return StyleSheet.create({
        ...global,
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
        fontFamily: FontFamily.regular,
        marginTop: 16,
        textAlign: 'center',
        },
        stateMessage: {
        fontSize: 14,
        color: theme.pageSubtitle,
        fontFamily: FontFamily.regular,
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
        fontFamily: FontFamily.regular,
        },
  });
};

export const createDentalPieceStyles = (theme: any) => {
    return StyleSheet.create({
        dentalPieceContainer: {
            alignItems: 'center',
            height: '100%', 
            gap: Spacing.one,
            maxHeight: 140,
            width: 38,
        },
        bottomDentalPieceContainer: {
            flexDirection: 'column-reverse'
        },
        numberPieceContainer: {
            height: '15%',
            paddingHorizontal: Spacing.two,
        },
        numberPieceSelectedContainer: {
            backgroundColor: theme.main,
            borderRadius: Spacing.six,
        },
        numberPiece: {
            color: theme.text,
            fontFamily: FontFamily.regular,
            fontWeight: FontWeight.medium
        },
        numberPieceSelected: {
            fontWeight: FontWeight.bold,
            color: theme.overMain,
        },
        stateDot: {
            height: '15%',                  
            aspectRatio: Spacing.quarter,      // Garantiza que se mantenga como un círculo perfecto (ancho = alto)
            borderRadius: Border.radius.wide,
            borderWidth: Spacing.none
        },
        stateDotHealthy: {
            borderWidth: Border.width.regular,
            borderColor: theme.cardSeparator
        },
        pressable: {
            height: '65%', justifyContent: 'center', alignItems: 'center'
        },
        toothAsset: {
            height: '100%',                   
            aspectRatio: 0.4,
            resizeMode: 'contain',
        },
        flipToothAsset: {
            transform: [{ scaleX: -1 }]
        }
    })
}
export const createDentalCuadrantStyles = () => {
    return StyleSheet.create({
        cuadrantRow: {
            flexDirection: 'row',
            gap: Spacing.three
        },
        leftCuadrantRow: {
            flexDirection: 'row-reverse',
        }
    })
}

export const createOdontogramStyles = (theme: any) => {
    const global = createGlobalStyles(theme);
    return StyleSheet.create({
        container: {
            marginHorizontal: Spacing.three,
            gap: Spacing.three
        },
        actionBtnsContainer: {
            flexDirection: 'row',
            gap: Spacing.two,
        },
        actionBtnShell: {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.breadcrumbSeparator,
            borderWidth: Border.width.regular,
            borderRadius: Border.radius.narrow,
            flexDirection: 'row',
            paddingHorizontal: Spacing.two,
            paddingVertical: Spacing.one,
            gap: Spacing.one,
        },
        actionBtnShellActive: {
            backgroundColor: theme.main,
            borderColor: theme.main,
        },
        actionBtnText: {
            fontFamily: FontFamily.regular,
            fontSize: FontSize.small,
            fontWeight: FontWeight.regular,
            color: theme.pageSubtitle,
        },
        actionBtnTextActive: {
            color: theme.overMain
        },
        legendContainer: {
            ...global.inputShell,
            flexDirection: 'row',
            gap: Spacing.two,
            justifyContent: 'space-around',
            overflow: 'hidden'
        },
        legendItem: {
            flexDirection: 'row',
            gap: Spacing.one,
            alignItems: 'center'
        },
        legendDot: {
            width: Spacing.two,
            height: Spacing.two,
            borderRadius: Border.radius.wide,
        },
        legendText: {
            ...global.text,
            fontSize: FontSize.small,
            fontWeight: FontWeight.regular,
            lineHeight: LineHeight.pageSubtitle,
            textAlign: 'center'
        },
        odontogramScrollContainer: {
            gap: Spacing.three
        },
        halfOdontogram: {
            gap: Spacing.two
        }
    });
}

export const createToothConditionModalStyles = (theme: any) => {
    const global = createGlobalStyles(theme);
    const odontogram = createOdontogramStyles(theme);
    return StyleSheet.create({
        container:{
            gap: Spacing.three,
        },
        horizontalContainer: {
            width: '100%',
            flexDirection: 'row',
            gap: Spacing.three,
            alignItems: 'flex-start', 
            // Añadimos una posición relativa para que la sección absoluta del diente se ancle aquí
            position: 'relative', 
        },
        dentalPieceSection: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 80, // Asignamos un ancho fijo para que actúe como columna estable
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
        pieceNumberText: {
            color: theme.text,
            fontSize: FontSize.h3,
            fontFamily: FontFamily.regular,
            fontWeight: FontWeight.extrabold,
            lineHeight: LineHeight.loginSubtitle,
        },
        textMultilineWrapper: {
            flex: Spacing.quarter,

        },
        dentalPieceSectionText: {
            color: theme.textNames,
            fontSize: FontSize.p,
            fontFamily: FontFamily.regular,
            fontWeight: FontWeight.regular,
            lineHeight: LineHeight.note,
        },
        dentalPieceContainer: {
            marginTop: Spacing.two,
            borderWidth: Border.width.regular,
            borderRadius: Border.radius.regular,
            
            // Toma de forma restrictiva todo el espacio vertical restante 
            // debajo del texto del número del diente, sin empujar jamás al padre.
            flex: 1, 
            width: '100%', // Se adapta al ancho de 80px de su sección padre
            alignSelf: 'center', 
            
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: Spacing.two,
        },
        stateSection: {
            flex: 1,
            // ✨ IMPORTANTE: Agregamos un margen izquierdo equivalente al ancho de la columna 
            // absoluta (80px) + el gap (Spacing.three), para que los botones no se encimen sobre el diente.
            marginLeft: 80 + Spacing.four,
        },
        label: {
            ...global.label,
        },
        buttonGroupRow:{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Spacing.one,
        },
        stateButton: { 
            ...odontogram.legendItem, 
            borderWidth: Border.width.regular,
            borderRadius: Border.radius.regular,
            borderColor: theme.cardSeparator,
            paddingHorizontal: Spacing.three,
            paddingVertical: Spacing.one,
            marginHorizontal: Spacing.one,
        },
        legendDot: { ...odontogram.legendDot },
        stateButtonText: {...odontogram.legendText,},
        surfaceContainerRow: {},
        surfaceButton: {},
        surfaceButtonText: {},
        surfaceStateSelectorBox: {
            paddingHorizontal: Spacing.two,
        },
        tinyLabel: {
            ...global.label,
            fontSize: FontSize.p,
        },
        actionBtns: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
        }
    });
}

export const createRegisterPatientStyles = (theme: any) => {
    const global = createGlobalStyles(theme);
    return StyleSheet.create({
        ...global,
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scroll: {
            flex: 1,
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
        fontFamily: FontFamily.regular, marginBottom: 4,
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
        fontFamily: FontFamily.regular,
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
        color: theme.overMain, fontSize: 13, fontWeight: '600', fontFamily: FontFamily.regular,
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
      btnCancelText: { color: theme.fieldLabel, fontSize: 14, fontWeight: '600', fontFamily: FontFamily.regular },
      btnSave: { backgroundColor: Colors.light.main, minWidth: 180 },
      btnSaveText: { color: theme.overMain, fontSize: 14, fontWeight: '600', fontFamily: FontFamily.regular },
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
        fontFamily: FontFamily.regular,
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
        fontFamily: FontFamily.regular,
        color: theme.pageTitle,
        height: '100%',
      },
      prefix: {
        fontSize: 14,
        fontFamily: FontFamily.regular,
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
        fontFamily: FontFamily.regular,
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
        fontFamily: FontFamily.regular,
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
        fontFamily: FontFamily.regular,
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
            fontFamily: FontFamily.regular,
            marginBottom: 2,
        },
        details: {
            fontSize: 12,
            color: theme.overMain,
            fontFamily: FontFamily.regular,
            marginBottom: 6,
        },
        phoneRow: { flexDirection: 'row', alignItems: 'center' },
        phone: {
            fontSize: 13,
            color: theme.overMain,
            fontFamily: FontFamily.regular,
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
            fontFamily: FontFamily.regular,
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
            fontFamily: FontFamily.regular,
        },
        chevron: {
            color: theme.breadcrumbSeparator,
            fontSize: 14,
        },
        currentText: {
            color: theme.main,
            fontSize: 14,
            fontWeight: '600',
            fontFamily: FontFamily.regular,
        },
    });
};

export const createActionBarStyles = (theme: any) => {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 8,
        },
        actions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        clinicalHistoryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: 40,
            borderRadius: 8,
            backgroundColor: theme.accentBackground,
            gap: 6,
        },
        clinicalHistoryText: {
            fontSize: 13,
            fontWeight: '600',
            color: Colors.light.main,
            fontFamily: FontFamily.regular,
        },
        iconButton: {
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: theme.accentBackground,
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
};

export const createBadgeStyles = (theme: any) => {
    return StyleSheet.create({
        row: {
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
        },
        badge: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.backgroundElement,
            borderRadius: 10,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: theme.cardSeparator,
        },
        badgeLabel: {
            fontSize: 11,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            fontWeight: '500',
        },
        badgeValue: {
            fontSize: 13,
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            fontWeight: '600',
        },
    });
};

export const createPatientFileSectionStyles = (theme: any) => {
    return StyleSheet.create({
      container: {
        backgroundColor: theme.backgroundElement,
        borderRadius: 10,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.cardSeparator,
        overflow: 'hidden',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
      },
      headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      headerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.pageTitle,
        fontFamily: FontFamily.regular,
      },
      content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
      },
    });
};

export const createDetailStyles = (theme: any) => {
    return StyleSheet.create({
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.pfpBorderColor,
        },
        label: {
            fontSize: 13,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            fontWeight: '500',
        },
        value: {
            fontSize: 13,
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            fontWeight: '600',
            maxWidth: '55%',
            textAlign: 'right',
        },
    });
};

export const createTreatmentStyles = (theme: any) => {
    return StyleSheet.create({
        card: {
            flexDirection: 'row',
            marginBottom: 4,
        },
        timelineColumn: {
            alignItems: 'center',
            width: 32,
            marginRight: 12,
        },
        iconDot: {
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            marginTop: 4,
        },
        line: {
            flex: 1,
            width: 2,
            backgroundColor: theme.cardSeparator,
            marginTop: 4,
        },
        content: {
            flex: 1,
            backgroundColor: theme.backgroundElement,
            borderRadius: 10,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.cardSeparator,
            marginBottom: 12,
        },
        dateRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
            flexWrap: 'wrap',
            gap: 4,
        },
        date: {
            fontSize: 12,
            color: Colors.light.main,
            fontFamily: FontFamily.regular,
            fontWeight: '600',
        },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
        },
        statusText: {
            fontSize: 10,
            fontWeight: '600',
            fontFamily: FontFamily.regular,
        },
        name: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            marginBottom: 4,
        },
        notes: {
            fontSize: 12,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            lineHeight: 17,
            marginBottom: 8,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            gap: 4,
        },
        metaText: {
            fontSize: 12,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
        },
        metaDot: {
            fontSize: 12,
            color: theme.cardSeparator,
        },
        actionsRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 16,
            borderTopWidth: 1,
            borderTopColor: theme.pfpBorderColor,
            paddingTop: 10,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        actionText: {
            fontSize: 12,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
        },
    });
};

export const createTreatmentSectionStyles = (theme: any) =>  {
    return StyleSheet.create({
        container: {
            marginHorizontal: 16,
            marginBottom: 16,
            backgroundColor: theme.backgroundElement,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.cardSeparator,
            padding: 16,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 15,
            fontWeight: '600',
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
        },
        addButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: theme.accentBackground,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
        },
        addButtonText: {
            fontSize: 13,
            color: Colors.light.main,
            fontWeight: '600',
            fontFamily: FontFamily.regular,
        },
        emptyState: {
            alignItems: 'center',
            paddingVertical: 32,
        },
        emptyTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            marginTop: 12,
        },
        emptyMessage: {
            fontSize: 12,
            color: theme.placeholderColor,
            fontFamily: FontFamily.regular,
            textAlign: 'center',
            marginTop: 4,
            paddingHorizontal: 32,
        },
    });
};

export const createMedicalRowStyles = (theme:any) => {
    return StyleSheet.create({
        row: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.pfpBorderColor,
        },
        iconContainer: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.accentBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
            marginTop: 2,
        },
        textContainer: {
            flex: 1,
        },
        label: {
            fontSize: 13,
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            fontWeight: '600',
            marginBottom: 2,
        },
        value: {
            fontSize: 13,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
        },
        noteText: {
            fontSize: 12,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            lineHeight: 18,
            marginTop: 2,
        },
    });
};

export const createExamStyles = (theme: any) => {
    return StyleSheet.create({
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.pfpBorderColor,
        },
        name: {
            fontSize: 13,
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            fontWeight: '500',
            flex: 1,
        },
        date: {
            fontSize: 12,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
            marginLeft: 12,
        },
        emptyState: {
            paddingVertical: 16,
            alignItems: 'center',
        },
        emptyText: {
            fontSize: 13,
            color: theme.placeholderColor,
            fontFamily: FontFamily.regular,
        },
    });
};

export const createPatientFileStyles = (theme: any) => {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContent: {
            paddingBottom: Platform.OS === 'ios' ? 100 : 80,
        },
        centerState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
        },
        stateTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.pageTitle,
            fontFamily: FontFamily.regular,
            marginTop: 16,
            textAlign: 'center',
        },
        stateMessage: {
            fontSize: 14,
            color: theme.pageSubtitle,
            fontFamily: FontFamily.regular,
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
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
        },
        retryText: {
            fontSize: 14,
            color: theme.overMain,
            fontWeight: '600',
            fontFamily: FontFamily.regular,
        },
    });
};