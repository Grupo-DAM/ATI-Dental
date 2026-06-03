import React, { type ReactNode } from 'react';
import { View, StyleSheet, Image, Text, Pressable, Alert } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

const getInitials = (name: string) => {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

type patientCard = {
    ID?: string;
    name?: string;
    email?: string;
    imgSrc?: string;
    lastVisit?: string;
    nextVisit?: string;
};

export function PatientCard({ID='#P-####', name='', email='', imgSrc='', lastVisit='-', nextVisit='-'}: patientCard) {
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
            <ThemedView style={styles.patientInfo}>
                <ThemedView style={styles.date}>
                    <ThemedText style={styles.text}>{ID}</ThemedText>
                    <ThemedView style={styles.imgContainer}>
                        <Text style={styles.imgText}>{getInitials(name)}</Text>
                    </ThemedView>
                    <ThemedView style={{gap: 0}}>
                        <ThemedText style={styles.patientName}>{name}</ThemedText>
                        <ThemedText style={styles.text}>{email}</ThemedText>
                    </ThemedView>
                </ThemedView>
                <ThemedView style={styles.date}>
                    <Image
                        source = {require('../../assets/images/icons/view.png')}
                        style = {styles.icon}
                    />
                    <Image
                        source = {require('../../assets/images/icons/edit.png')}
                        style = {styles.icon}
                    />
                </ThemedView>
            </ThemedView>
            <ThemedView style={styles.visitInfo}>
                <ThemedView style={styles.date}>
                    <ThemedText style={[styles.text, styles.visitLabel]}>ÚLTIMA VISITA:</ThemedText>
                    <ThemedText  style={styles.text}>{lastVisit}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.date}>
                    <ThemedText style={[styles.text, styles.visitLabel, styles.purple]}>PRÓXIMA CITA:</ThemedText>
                    <ThemedText style={[styles.text, styles.purple]}>{nextVisit}</ThemedText>
                </ThemedView>
            </ThemedView>
        </ThemedView>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressableContainer: {
        width: '100%',
        alignSelf: 'stretch',
    },
    patientCard: {
        backgroundColor: 'white',
        width: '100%',
        borderBottomColor: '#D1D5DB',
        borderBottomWidth: 1,
        paddingHorizontal: Spacing.four,
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
        color: '#4A4A4A',
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
        color: '#6B7280',
    },
    purple: {
        color: '#5B2D8B',
    },
    icon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    }
});