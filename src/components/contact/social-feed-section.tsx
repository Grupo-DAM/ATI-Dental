import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';

import { officialSocialUrl, SocialNetwork, SocialPost, formatSocialTimeAgo, groupSocialPosts } from '@/components/contact/social-feed';
import { useSocialFeed } from '@/components/contact/use-social-feed';
import { createStyles } from '@/constants/styles/contact.styles';
import { useTheme } from '@/hooks/use-theme';

const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

async function openSocialUrl(url: string, title: string, message: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(title, message);
  }
}

function ChannelHeader({
  network,
  onPress,
  styles,
  theme,
}: {
  network: SocialNetwork;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  theme: ReturnType<typeof useTheme>;
}) {
  if (network === 'instagram') {
    return (
      <Pressable
        testID="social-channel-instagram"
        onPress={onPress}
        accessibilityRole="button"
        style={styles.socialHitTarget}
      >
        <LinearGradient
          colors={theme.instagramGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.socialChannelHeader}
        >
          <View style={styles.instagramHeaderRow}>
            <View style={styles.instagramHeaderLeft}>
              <Ionicons name="camera-outline" size={22} color={theme.instagramTextColor} style={styles.socialIcon} />
              <Text style={[styles.socialName, styles.instagramHeaderText]}>Instagram</Text>
            </View>
            <Text style={[styles.socialTag, styles.instagramHeaderText]}>@atidental_</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="social-channel-facebook"
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.socialChannelHeader, styles.facebookHeader, styles.socialHitTarget]}
    >
      <Ionicons name="logo-facebook" size={22} color={theme.facebookTextColor} style={styles.socialIcon} />
      <View>
        <Text style={[styles.socialName, styles.facebookHeaderText]}>Facebook</Text>
        <Text style={[styles.socialTag, styles.facebookHeaderText]}>/ATI Dental</Text>
      </View>
    </Pressable>
  );
}

export function SocialFeedSection() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { posts, status } = useSocialFeed();
  const grouped = groupSocialPosts(posts);
  const errorTitle = t('contacts.alerts.error');
  const socialError = (platform: string) => t('contacts.alerts.socialError', { platform });

  const openNetwork = (network: SocialNetwork) =>
    openSocialUrl(officialSocialUrl(network), errorTitle, socialError(network));

  const openPost = (post: SocialPost) =>
    openSocialUrl(post.url, errorTitle, socialError(post.network));

  return (
    <View style={styles.sectionContainer} testID="social-feed-section">
      <View style={styles.sectionHeader}>
        <Ionicons name="share-social-outline" size={20} color={theme.main} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{t('contacts.socialActivity')}</Text>
      </View>

      {status === 'loading' ? (
        <ActivityIndicator testID="social-feed-loading" size="large" color={theme.main} style={styles.socialLoader} />
      ) : null}

      {status === 'fallback' ? (
        <View testID="social-feed-fallback" style={styles.socialFallbackBox}>
          <Text style={styles.directContactSubtitle}>{t('contacts.socialFallback')}</Text>
          <Pressable
            testID="social-fallback-instagram"
            accessibilityRole="button"
            style={[styles.socialFallbackButton, styles.socialFallbackInstagram]}
            onPress={() => openNetwork('instagram')}
          >
            <Ionicons name="logo-instagram" size={18} color={theme.instagramTextColor} />
            <Text style={styles.socialFallbackLabel}>{t('contacts.openInstagram')}</Text>
          </Pressable>
          <Pressable
            testID="social-fallback-facebook"
            accessibilityRole="button"
            style={[styles.socialFallbackButton, styles.socialFallbackFacebook]}
            onPress={() => openNetwork('facebook')}
          >
            <Ionicons name="logo-facebook" size={18} color={theme.facebookTextColor} />
            <Text style={styles.socialFallbackLabel}>{t('contacts.openFacebook')}</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'ready' ? (
        <>
          <View style={styles.socialSubfeed}>
            <ChannelHeader network="instagram" onPress={() => openNetwork('instagram')} styles={styles} theme={theme} />
            <View testID="social-instagram-list" style={styles.instagramList}>
              {grouped.instagram.map((item) => (
                <Pressable
                  key={item.id}
                  testID={`social-post-${item.id}`}
                  accessibilityRole="button"
                  onPress={() => openPost(item)}
                  style={styles.instagramCard}
                >
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : avatarFallback}
                    style={styles.instagramImage}
                    contentFit="cover"
                  />
                  <View style={styles.instagramContent}>
                    <Text numberOfLines={1} style={styles.instagramPostTitle}>
                      {item.title ?? item.content}
                    </Text>
                    <Text numberOfLines={2} style={styles.instagramPostDesc}>
                      {item.content}
                    </Text>
                    {item.publishedAt ? (
                      <Text style={styles.instagramPostTime}>
                        {formatSocialTimeAgo(item.publishedAt, Date.now(), i18n.language)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.socialSubfeed}>
            <ChannelHeader network="facebook" onPress={() => openNetwork('facebook')} styles={styles} theme={theme} />
            <View testID="social-facebook-list" style={styles.instagramList}>
              {grouped.facebook.map((item) => (
                <Pressable
                  key={item.id}
                  testID={`social-post-${item.id}`}
                  accessibilityRole="button"
                  onPress={() => openPost(item)}
                  style={styles.instagramCard}
                >
                  <Image
                    source={item.imageUrl ? { uri: item.imageUrl } : avatarFallback}
                    style={styles.instagramImage}
                    contentFit="cover"
                  />
                  <View style={styles.instagramContent}>
                    <Text numberOfLines={1} style={styles.instagramPostTitle}>
                      {item.title ?? item.content}
                    </Text>
                    <Text numberOfLines={2} style={styles.instagramPostDesc}>
                      {item.content}
                    </Text>
                    {item.publishedAt ? (
                      <Text style={styles.instagramPostTime}>
                        {formatSocialTimeAgo(item.publishedAt, Date.now(), i18n.language)}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
