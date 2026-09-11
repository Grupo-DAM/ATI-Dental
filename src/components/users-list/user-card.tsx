import React, { type ReactNode } from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet, Text, Pressable, Alert } from 'react-native';
import { Switch } from '@/components/ui/switch.tsx';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

import { useTranslation } from 'react-i18next';
import { Color, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getRoleLabelKey, type AppUserRole } from '@/constants/user-roles';

//Este componente sirve tanto para el listado de pacientes como para el listado de usuarios

const EditIcon = require('@/assets/icons/edit.svg');
const ViewIcon = require('@/assets/icons/view.svg');

const getInitials = (name: string) => {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const getStatusString = (status: boolean, t ) => {
    if (status) return t('admin-users.activeStatus');
    return t('admin-users.inactiveStatus');
};

const getRoleString = (role: AppUserRole | undefined, t: any) => {
    const translationKey = getRoleLabelKey(role);
    return t(translationKey);
};

type PatientData = {
    type?: 'patient';
    lastVisit?: string;
    nextVisit?: string;
    status?: never;
    role?: never;
};

type GeneralUserData = {
    type: 'general';
    status?: boolean;
    switchStatus: () => void;
    role?: string;
    lastVisit?: never;
    nextVisit?: never;
};

type userCard = {
    ID?: string;
    name?: string;
    email?: string;
    imgSrc?: string;
    type?: 'general';
} & (PatientData | GeneralUserData);

export function UserCard({
        ID='#P-####',
        name='',
        email='',
        imgSrc='',
        type = 'general',
        lastVisit='-',
        nextVisit='-',
        status=true,
        switchStatus,
        role='User'
    }: userCard) {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable
            style={styles.pressableContainer}
            onPress={() => Alert.alert('Press', 'Card de paciente presionada', [
                { text: 'Cancel' },
                { text: 'OK' }
            ])}
            onLongPress={() => Alert.alert('Long Press', 'Card de paciente presionada por más tiempo', [
                { text: 'Cancel' },
                { text: 'OK' }
            ])}
        >
        <ThemedView style={styles.patientCard}>
            <View style={styles.patientInfo}>
                <View style={styles.date}>
                    <ThemedText style={styles.text}>{ID}</ThemedText>
                    <View style={styles.imgContainer}>
                        <Text style={styles.imgText}>{getInitials(name)}</Text>
                    </View>
                    <View style={{gap: 0}}>
                        <ThemedText style={styles.patientName}>{name}</ThemedText>
                        <ThemedText style={styles.text}>{email}</ThemedText>
                    </View>
                </View>

                    <View style={styles.date}>
                    {type === 'patient' && (
                        <Image
                            source = {ViewIcon}
                            style = {styles.icon}
                        />
                    )}
                        <Image
                            source = {EditIcon}
                            style = {[styles.icon, styles.editIcon]}
                        />

                    {type === 'general' && (
                        <Switch
                            value = {status}
                            onSwitch = {switchStatus}
                        />
                     )}
                    </View>

            </View>
            <View style={styles.visitInfo}>
                <View style={styles.date}>
                    <ThemedText style={[styles.text, styles.visitLabel]}>
                            {type === 'general' ? (
                                t('admin-users.statusLabel')
                            ) : (
                                t('user-card.lastVisitLabel')
                            )}
                    </ThemedText>
                    <ThemedText  style={styles.text}>
                    { type === 'general' ? (
                        getStatusString(status, t)
                        ) : (lastVisit)
                    }
                    </ThemedText>
                </View>
                <View style={styles.date}>
                    <ThemedText style={[styles.text, styles.visitLabel, styles.purple]}>
                        { type === 'general' ? (
                            t('admin-users.roleLabel')
                        ) : (
                            t('user-card.nextVisitLabel')
                        )}
                    </ThemedText>
                    <ThemedText style={[styles.text, styles.purple]}>
                        { type === 'general' ? getRoleString(role, t) : nextVisit }
                    </ThemedText>
                </View>
            </View>

        </ThemedView>
        </Pressable>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    pressableContainer: {
        width: '100%',
        alignSelf: 'stretch'
    },
    patientCard: {
        width: '100%',
        borderBottomColor: theme.cardSeparator,
        borderBottomWidth: 1,
        paddingHorizontal: Spacing.four,
        backgroundColor: theme.backgroundElement,
        paddingTop: 6
    },
    patientInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    imgText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    imgContainer: {
        width: 36,
        height: 36,
        backgroundColor: '#8F6BB3',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 200,
    },
    patientName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.textNames,
        marginBottom: -10
    },
    visitInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    visitLabel: {
        fontWeight: 'bold',
    },
    date: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    text: {
        fontSize: 10,
        fontWeight: 'light',
        color: theme.pageSubtitle,
    },
    purple: {
        color: theme.main,
    },
    icon: {
        width: 21,
        height: 21,
        resizeMode: 'contain',
    },
    editIcon: {
        width: 18,
        height: 18,
    },
});