import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { type Href, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import {
  NavigationMenuIconSlot,
  type NavigationMenuIconKey,
} from '@/components/navigation/navigation-menu-icon-slot';
import { getNavigationDisplayName } from '@/constants/navigation-user';
import { getRoleLabelKey, isAdminUser } from '@/constants/user-roles';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

type NavigationDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type MenuItem = {
  testID: string;
  route: string;
  segment: string;
  iconKey: NavigationMenuIconKey;
  icon: number;
  labelKey: string;
};

type AdminSubItem = {
  testID: string;
  route: string;
  segment: string;
  labelKey: string;
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';
const SLIDE_IN_MS = 280;
const SLIDE_OUT_MS = 220;

const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    testID: 'nav-item-patients',
    route: '/(tabs)/explore',
    segment: 'explore',
    iconKey: 'patients',
    icon: require('@/assets/expo.icon/Assets/patients.svg'),
    labelKey: 'navigation.patientList',
  },
  {
    testID: 'nav-item-register-patient',
    route: '/(tabs)/register-patient',
    segment: 'register-patient',
    iconKey: 'register',
    icon: require('@/assets/expo.icon/Assets/register-patient.svg'),
    labelKey: 'navigation.registerPatient',
  },
  {
    testID: 'nav-item-profile',
    route: '/(tabs)/profile',
    segment: 'profile',
    iconKey: 'profile',
    icon: require('@/assets/expo.icon/Assets/profile.svg'),
    labelKey: 'navigation.profileLanguage',
  },
  {
    testID: 'nav-item-contact',
    route: '/(tabs)/contacts',
    segment: 'contacts',
    iconKey: 'contact',
    icon: require('@/assets/expo.icon/Assets/contact.svg'),
    labelKey: 'navigation.contact',
  },
];

const ADMIN_SUBMENU_ITEMS: AdminSubItem[] = [
  {
    testID: 'nav-item-admin-users',
    route: '/(tabs)/admin/users',
    segment: 'users',
    labelKey: 'navigation.adminUsers',
  },
  {
    testID: 'nav-item-admin-reports',
    route: '/(tabs)/admin/reports',
    segment: 'reports',
    labelKey: 'navigation.adminReports',
  },
  {
    testID: 'nav-item-admin-contact-info',
    route: '/(tabs)/update-contact-info',
    segment: 'update-contact-info',
    labelKey: 'navigation.adminContactInfo',
  },
];

export function NavigationDrawer({ visible, onClose }: Readonly<NavigationDrawerProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(visible);
  const wasVisibleRef = useRef(visible);
  const translateX = useSharedValue(width);

  const unmountDrawer = useCallback(() => {
    wasVisibleRef.current = false;
    setIsMounted(false);
  }, []);

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      setIsMounted(true);
      translateX.value = withTiming(0, {
        duration: SLIDE_IN_MS,
        easing: Easing.out(Easing.cubic),
      });
      return () => {
        cancelAnimation(translateX);
      };
    }

    if (!wasVisibleRef.current) {
      return;
    }

    translateX.value = withTiming(
      width,
      {
        duration: SLIDE_OUT_MS,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(unmountDrawer);
        }
      },
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [translateX, unmountDrawer, visible, width]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeSegment = segments[segments.length - 1];
  const isAdminRouteActive = ADMIN_SUBMENU_ITEMS.some((item) => item.segment === activeSegment);
  const showAdminSection = isAdminUser(user);
  const displayName = getNavigationDisplayName(user, t('navigation.defaultUser'));
  const roleLabel = t(getRoleLabelKey(user?.rol));

  const navigateTo = (route: string) => {
    onClose();
    router.push(route as Href);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <Modal
      visible={isMounted}
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <Animated.View style={[styles.container, { paddingBottom: insets.bottom }, panelStyle]}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable
            testID="nav-drawer-close"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('navigation.title')}</Text>
        </View>

        <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuContent}>
          {MAIN_MENU_ITEMS.map((item) => (
            <Pressable
              key={item.testID}
              testID={item.testID}
              accessibilityRole="button"
              onPress={() => navigateTo(item.route)}
              style={({ pressed }) => [
                styles.menuItem,
                activeSegment === item.segment && styles.menuItemActive,
                pressed && styles.pressed,
              ]}>
              <NavigationMenuIconSlot iconKey={item.iconKey} source={item.icon} />
              <Text style={styles.menuItemText}>{t(item.labelKey)}</Text>
            </Pressable>
          ))}

          {showAdminSection ? (
            <View style={styles.adminSection} testID="nav-admin-section">
              <Pressable
                testID="nav-item-admin-toggle"
                accessibilityRole="button"
                onPress={() => setAdminExpanded((prev) => !prev)}
                style={({ pressed }) => [
                  styles.menuItem,
                  isAdminRouteActive && styles.menuItemActive,
                  pressed && styles.pressed,
                ]}>
                <NavigationMenuIconSlot
                  iconKey="admin"
                  source={require('@/assets/expo.icon/Assets/admin.svg')}
                />
                <Text style={[styles.menuItemText, styles.adminTitle]}>
                  {t('navigation.administration')}
                </Text>
                <Ionicons
                  name={adminExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#FFFFFF"
                  style={styles.adminChevron}
                />
              </Pressable>

              {adminExpanded ? (
                <View style={styles.adminSubmenu}>
                  {ADMIN_SUBMENU_ITEMS.map((item) => (
                    <Pressable
                      key={item.testID}
                      testID={item.testID}
                      accessibilityRole="button"
                      onPress={() => navigateTo(item.route)}
                      style={({ pressed }) => [
                        styles.subMenuItem,
                        activeSegment === item.segment && styles.menuItemActive,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={styles.subMenuItemText}>{t(item.labelKey)}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            testID="nav-item-logout"
            accessibilityRole="button"
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
            <Text style={styles.logoutText}>{t('navigation.logout')}</Text>
          </Pressable>
          <View style={styles.footerProfile}>
            <View style={styles.footerUser}>
              <Image
                source={require('@/assets/expo.icon/Assets/avatar.png')}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.footerUserText}>
                <Text style={styles.footerName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.footerRole} numberOfLines={1}>
                  {roleLabel}
                </Text>
              </View>
            </View>
            <Text style={styles.version}>v{APP_VERSION}</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.main,
  },
  header: {
    backgroundColor: Colors.light.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Open Sans',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  menuItemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
  adminSection: {
    marginTop: 4,
  },
  adminTitle: {
    flex: 1,
  },
  adminChevron: {
    marginLeft: 'auto',
  },
  adminSubmenu: {
    marginLeft: 36,
    marginTop: 4,
    gap: 2,
  },
  subMenuItem: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  subMenuItemText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Open Sans',
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  footerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
  footerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerUserText: {
    flex: 1,
  },
  footerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Open Sans',
  },
  footerRole: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontFamily: 'Open Sans',
    marginTop: 2,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontFamily: 'Open Sans',
  },
  pressed: {
    opacity: 0.85,
  },
});
