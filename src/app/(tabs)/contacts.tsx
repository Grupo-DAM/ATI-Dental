import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';

import { PageTitleLayout } from '@/components/page-title-layout';
import { ContactButton } from '@/components/contact/contact-button';
import { ResponsibleCard } from '@/components/contact/responsible-card';
import { SocialFeedSection } from '@/components/contact/social-feed-section';
import { Config } from '@/constants/config';
import { Colors } from '@/constants/theme';
import { createStyles } from '@/constants/styles/contact.styles';
import { useTheme } from '@/hooks/use-theme';
import { firestore } from '@/config/firebase';

export default function ContactsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const netInfo = useNetInfo();

  const [responsibles, setResponsibles] = useState<any[]>([]);
  const [globalContact, setGlobalContact] = useState<{ email?: string; telefono?: string; whatsapp?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('responsibles')
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setResponsibles(data);
          setIsFromCache(snapshot.metadata.fromCache);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching responsibles: ", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('configuracion')
      .doc('contacto')
      .onSnapshot(
        (doc) => {
          if (typeof doc.exists === 'function' ? doc.exists() : doc.exists) {
            setGlobalContact(doc.data() as any);
          }
        },
        (error) => {
          console.error("Error fetching global contact: ", error);
        }
      );
    return () => unsubscribe();
  }, []);

  const handleEmailPress = async (customEmail?: string) => {
    const targetEmail = customEmail || globalContact?.email || Config.contact.email;
    const url = `mailto:${targetEmail}?subject=${encodeURIComponent(Config.contact.emailSubject)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('No mail client available');
      }
    } catch (error) {
      Alert.alert(
        t('contacts.alerts.emailTitle'),
        t('contacts.alerts.emailError', { email: targetEmail }),
        [
          {
            text: t('contacts.alerts.copyToClipboard'),
            onPress: () => {
              Clipboard.setString(targetEmail);
              Alert.alert(t('contacts.alerts.copiedTitle'), t('contacts.alerts.copiedEmail'));
            },
          },
          { text: t('contacts.alerts.close'), style: 'cancel' },
        ]
      );
    }
  };

  const handlePhonePress = async (customPhone?: string) => {
    const targetPhone = customPhone || globalContact?.telefono || Config.contact.phone;
    const url = `tel:${targetPhone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        throw new Error('Call dialing not supported');
      }
    } catch (error) {
      Alert.alert(
        t('contacts.alerts.phoneTitle'),
        t('contacts.alerts.phoneError', { phone: targetPhone }),
        [
          {
            text: t('contacts.alerts.copyToClipboard'),
            onPress: () => {
              Clipboard.setString(targetPhone);
              Alert.alert(t('contacts.alerts.copiedTitle'), t('contacts.alerts.copiedPhone'));
            },
          },
          { text: t('contacts.alerts.close'), style: 'cancel' },
        ]
      );
    }
  };

  const handleWhatsAppPress = async () => {
    const rawWhatsApp = globalContact?.whatsapp || Config.contact.whatsApp;
    const formattedPhone = rawWhatsApp.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(Config.contact.whatsAppMessage)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(t('contacts.alerts.error'), t('contacts.alerts.whatsappError'));
    }
  };

  const isOffline = !netInfo.isConnected && isFromCache;

  return (
    <PageTitleLayout
      titleKey='contacts.title'
      subtitleKey='contacts.subtitle'
      parentBreadcrumbKey='tabs.home'
      currentBreadcrumbKey='contacts.title'
    >
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color={theme.offlineBannerText} style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>{t('contacts.offlineMode')}</Text>
        </View>
      )}

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card" size={20} color={Colors.light.main} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>{t('contacts.responsibles')}</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors.light.main} style={{ padding: 20 }} />
        ) : (
          <View style={styles.responsiblesList}>
            {responsibles.map((resp) => (
              <ResponsibleCard
                key={resp.id}
                title={resp.title}
                name={resp.name}
                role={resp.role}
                description={resp.description}
                imageUrl={typeof resp.imageUrl === 'string' ? { uri: resp.imageUrl } : resp.imageUrl}
                isOnline={resp.isOnline}
                onEmailPress={() => handleEmailPress(resp.email)}
                onPhonePress={() => handlePhonePress(resp.phone)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={[styles.sectionContainer, styles.directContactSection]}>
        <View style={[styles.sectionHeader, styles.directContactHeader]}>
          <Ionicons name="chatbubbles" size={20} color={Colors.light.main} style={styles.sectionIcon} />
          <Text style={styles.directContactTitle}>{t('contacts.directContact')}</Text>
        </View>
        <Text style={styles.directContactSubtitle}>
          {t('contacts.directContactSubtitle')}
        </Text>
        <View style={styles.buttonGroup}>
          <ContactButton type="email" onPress={() => handleEmailPress()} />
          <ContactButton type="phone" onPress={() => handlePhonePress()} />
          <ContactButton type="whatsapp" onPress={handleWhatsAppPress} />
        </View>
      </View>

      <SocialFeedSection />
    </PageTitleLayout>
  );
}
