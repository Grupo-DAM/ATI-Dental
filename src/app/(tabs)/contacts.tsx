import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { ContactButton } from '@/components/contact/contact-button';
import { ResponsibleCard } from '@/components/contact/responsible-card';
import { Config } from '@/constants/config';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { firestore } from '@/config/firebase';

// Mock images representing local assets or high-quality photos
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

const instagramPosts = [
  {
    id: 'ig-1',
    title: '¡Nueva tecnología en clínica!',
    description: 'Incorporamos escáneres 3D para mejorar diagnósticos y tratamientos de ortodoncia.',
    time: 'Hace 2 horas',
    imageUrl: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'ig-2',
    title: 'Sonrisas que inspiran',
    description: 'La felicidad de nuestros pacientes es nuestro mayor logro. ¡Gracias por confiar!',
    time: 'Hace 1 día',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&h=300&q=80',
  },
  {
    id: 'ig-3',
    title: 'Horarios extendidos',
    description: 'Ahora atendemos los sábados hasta las 2:00 PM.',
    time: 'Hace 3 días',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=300&h=300&q=80',
  },
];

const facebookPosts = [
  {
    id: 'fb-1',
    author: 'ATI Dental',
    time: 'Hoy',
    content: 'Recuerden que la prevención es la clave. Agenda tu limpieza dental semestral hoy mismo llamando al 555-0199.',
  },
  {
    id: 'fb-2',
    author: 'ATI Dental',
    time: 'Ayer',
    content: '¡Feliz día del odontólogo a todo nuestro increíble equipo! Su dedicación hace sonreír al mundo. 🎉🦷',
  },
  {
    id: 'fb-3',
    author: 'ATI Dental',
    time: '30 Oct',
    content: 'Compartimos un artículo interesante sobre la importancia de la salud gingival en pacientes diabéticos. [Enlace]',
  },
];



export default function ContactsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const netInfo = useNetInfo();

  const [responsibles, setResponsibles] = useState<any[]>([]);
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



  const handleEmailPress = async (customEmail?: string) => {
    const targetEmail = customEmail || Config.contact.email;
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
    const targetPhone = customPhone || Config.contact.phone;
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
    const formattedPhone = Config.contact.whatsApp.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(Config.contact.whatsAppMessage)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(t('contacts.alerts.error'), t('contacts.alerts.whatsappError'));
    }
  };

  const handleSocialLinkPress = async (platform: 'instagram' | 'facebook') => {
    const url = platform === 'instagram' ? Config.social.instagram : Config.social.facebook;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(t('contacts.alerts.error'), t('contacts.alerts.socialError', { platform }));
    }
  };

  const isOffline = !netInfo.isConnected || isFromCache;

  return (
    <View style={styles.container}>
      <AppHeader />
      <Breadcrumb parent={t('tabs.home')} current={t('contacts.title')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('contacts.title')}</Text>
          <Text style={styles.subtitle}>
            {t('contacts.subtitle')}
          </Text>
        </View>

        {isOffline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#B45309" style={{ marginRight: 6 }} />
            <Text style={styles.offlineText}>{t('contacts.offlineMode')}</Text>
          </View>
        )}



        {/* Section 1: Responsables */}
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

        {/* Section 2: Contacto Directo */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color={Colors.light.main} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('contacts.directContact')}</Text>
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

        {/* Section 3: Redes Sociales */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="share-social" size={20} color={Colors.light.main} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>{t('contacts.socialActivity')}</Text>
          </View>

          {/* Instagram Subfeed */}
          <View style={styles.socialSubfeed}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSocialLinkPress('instagram')}
            >
              <LinearGradient
                colors={['#833AB4', '#E1306C', '#F56040']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.socialChannelHeader}
              >
                <Ionicons name="logo-instagram" size={22} color="#FFFFFF" style={styles.socialIcon} />
                <View>
                  <Text style={[styles.socialName, { color: '#FFFFFF' }]}>Instagram</Text>
                  <Text style={[styles.socialTag, { color: '#FFFFFF' }]}>@ati_dental</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.instagramScroll}>
              {instagramPosts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  activeOpacity={0.9}
                  onPress={() => handleSocialLinkPress('instagram')}
                  style={styles.instagramCard}
                >
                  <Image source={{ uri: post.imageUrl }} style={styles.instagramImage} contentFit="cover" />
                  <View style={styles.instagramContent}>
                    <Text numberOfLines={1} style={styles.instagramPostTitle}>{post.title}</Text>
                    <Text numberOfLines={2} style={styles.instagramPostDesc}>{post.description}</Text>
                    <Text style={styles.instagramPostTime}>{post.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Facebook Subfeed */}
          <View style={styles.socialSubfeed}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSocialLinkPress('facebook')}
              style={styles.socialChannelHeader}
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" style={styles.socialIcon} />
              <View>
                <Text style={styles.socialName}>Facebook</Text>
                <Text style={styles.socialTag}>/ATIDentalOficial</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.facebookList}>
              {facebookPosts.map((post) => (
                <View key={post.id} style={styles.facebookCard}>
                  <View style={styles.facebookCardHeader}>
                    <Image source={avatarFallback} style={styles.facebookAvatar} contentFit="cover" />
                    <View>
                      <Text style={styles.facebookAuthor}>{post.author}</Text>
                      <Text style={styles.facebookTime}>{post.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.facebookText}>{post.content}</Text>
                  <View style={styles.facebookActions}>
                    <TouchableOpacity activeOpacity={0.6} style={styles.facebookActionButton}>
                      <Ionicons name="thumbs-up-outline" size={16} color="#65676B" style={{ marginRight: 6 }} />
                      <Text style={styles.facebookActionText}>Me gusta</Text>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.6} style={styles.facebookActionButton}>
                      <Ionicons name="chatbubble-outline" size={16} color="#65676B" style={{ marginRight: 6 }} />
                      <Text style={styles.facebookActionText}>Comentar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F8',
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
    color: '#1F2937', // Ebony Clay
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280', // Pale Sky
    lineHeight: 20,
    fontFamily: 'Open Sans',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineText: {
    fontSize: 12,
    color: '#B45309',
    fontFamily: 'Open Sans',
    fontWeight: '600',
  },
  sectionContainer: {
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
    fontFamily: 'Open Sans',
  },
  responsiblesList: {
    gap: 12,
  },
  directContactSubtitle: {
    fontSize: 12,
    color: '#4A4A4A',
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
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  socialTag: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
  },
  instagramScroll: {
    flexDirection: 'row',
  },
  instagramCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
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
    color: '#4A4A4A',
    fontFamily: 'Open Sans',
  },
  instagramPostDesc: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    lineHeight: 14,
    marginVertical: 4,
  },
  instagramPostTime: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
  },
  facebookList: {
    gap: 12,
  },
  facebookCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#4A4A4A',
    fontFamily: 'Open Sans',
  },
  facebookTime: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
  },
  facebookText: {
    fontSize: 13,
    color: '#1F2937',
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
});
