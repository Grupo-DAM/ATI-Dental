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

type FeedStyles = ReturnType<typeof createStyles>;
type AppTheme = ReturnType<typeof useTheme>;

function ChannelHeader({
  network,
  onPress,
  styles,
  theme,
}: Readonly<{
  network: SocialNetwork;
  onPress: () => void;
  styles: FeedStyles;
  theme: AppTheme;
}>) {
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

function SocialPostList({
  testID,
  posts,
  styles,
  language,
  onPress,
}: Readonly<{
  testID: string;
  posts: SocialPost[];
  styles: FeedStyles;
  language: string;
  onPress: (post: SocialPost) => void;
}>) {
  return (
    <View testID={testID} style={styles.instagramList}>
      {posts.map((item) => (
        <Pressable
          key={item.id}
          testID={`social-post-${item.id}`}
          accessibilityRole="button"
          onPress={() => onPress(item)}
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
                {formatSocialTimeAgo(item.publishedAt, Date.now(), language)}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
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
          {([
            ['social-fallback-instagram', 'instagram', 'logo-instagram', t('contacts.openInstagram'), styles.socialFallbackInstagram, theme.instagramTextColor],
            ['social-fallback-facebook', 'facebook', 'logo-facebook', t('contacts.openFacebook'), styles.socialFallbackFacebook, theme.facebookTextColor],
          ] as const).map(([testID, network, icon, label, buttonStyle, color]) => (
            <Pressable
              key={testID}
              testID={testID}
              accessibilityRole="button"
              style={[styles.socialFallbackButton, buttonStyle]}
              onPress={() => openNetwork(network)}
            >
              <Ionicons name={icon} size={18} color={color} />
              <Text style={styles.socialFallbackLabel}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {status === 'ready' ? (
        <>
          <View style={styles.socialSubfeed}>
            <ChannelHeader network="instagram" onPress={() => openNetwork('instagram')} styles={styles} theme={theme} />
            <SocialPostList
              testID="social-instagram-list"
              posts={grouped.instagram}
              styles={styles}
              language={i18n.language}
              onPress={openPost}
            />
          </View>

          <View style={styles.socialSubfeed}>
            <ChannelHeader network="facebook" onPress={() => openNetwork('facebook')} styles={styles} theme={theme} />
            <SocialPostList
              testID="social-facebook-list"
              posts={grouped.facebook}
              styles={styles}
              language={i18n.language}
              onPress={openPost}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}
