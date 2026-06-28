import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { NavigationMenuIconSlot } from '@/components/navigation/navigation-menu-icon-slot';
import { getRoleLabelKey, isAdminUser } from '@/constants/user-roles';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

type NavigationDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type MenuRoute =
  | '/(tabs)/explore'
  | '/(tabs)/register-patient'
  | '/(tabs)/profile'
  | '/(tabs)/contacts';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';

export function NavigationDrawer({ visible, onClose }: Readonly<NavigationDrawerProps>) {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [adminExpanded, setAdminExpanded] = useState(false);

  const activeSegment = segments[segments.length - 1];
  const showAdminSection = isAdminUser(user);

  const displayName = useMemo(() => {
    if (user?.nombre?.trim()) {
      return user.nombre.trim();
    }
    if (user?.alias?.trim()) {
      return user.alias.trim();
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return t('navigation.defaultUser');
  }, [t, user?.alias, user?.email, user?.nombre]);

  const roleLabel = t(getRoleLabelKey(user?.rol));

  const navigateTo = (route: MenuRoute) => {
    onClose();
    router.push(route);
  };

  const isActive = (segment: string) => activeSegment === segment;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
          <Pressable
            testID="nav-item-patients"
            accessibilityRole="button"
            onPress={() => navigateTo('/(tabs)/explore')}
            style={({ pressed }) => [
              styles.menuItem,
              isActive('explore') && styles.menuItemActive,
              pressed && styles.pressed,
            ]}>
            <NavigationMenuIconSlot iconKey="patients" />
            <Text style={styles.menuItemText}>{t('navigation.patientList')}</Text>
          </Pressable>

          <Pressable
            testID="nav-item-register-patient"
            accessibilityRole="button"
            onPress={() => navigateTo('/(tabs)/register-patient')}
            style={({ pressed }) => [
              styles.menuItem,
              isActive('register-patient') && styles.menuItemActive,
              pressed && styles.pressed,
            ]}>
            <NavigationMenuIconSlot iconKey="register" />
            <Text style={styles.menuItemText}>{t('navigation.registerPatient')}</Text>
          </Pressable>

          <Pressable
            testID="nav-item-profile"
            accessibilityRole="button"
            onPress={() => navigateTo('/(tabs)/profile')}
            style={({ pressed }) => [
              styles.menuItem,
              isActive('profile') && styles.menuItemActive,
              pressed && styles.pressed,
            ]}>
            <NavigationMenuIconSlot iconKey="profile" />
            <Text style={styles.menuItemText}>{t('navigation.profileLanguage')}</Text>
          </Pressable>

          <Pressable
            testID="nav-item-contact"
            accessibilityRole="button"
            onPress={() => navigateTo('/(tabs)/contacts')}
            style={({ pressed }) => [
              styles.menuItem,
              isActive('contacts') && styles.menuItemActive,
              pressed && styles.pressed,
            ]}>
            <NavigationMenuIconSlot iconKey="contact" />
            <Text style={styles.menuItemText}>{t('navigation.contact')}</Text>
          </Pressable>

          {showAdminSection ? (
            <View style={styles.adminSection} testID="nav-admin-section">
              <Pressable
                testID="nav-item-admin-toggle"
                accessibilityRole="button"
                onPress={() => setAdminExpanded((prev) => !prev)}
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                <NavigationMenuIconSlot iconKey="admin" />
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
                  <Pressable
                    testID="nav-item-admin-users"
                    accessibilityRole="button"
                    onPress={() => {
                      onClose();
                      router.push('/(tabs)/admin/users');
                    }}
                    style={({ pressed }) => [styles.subMenuItem, pressed && styles.pressed]}>
                    <Text style={styles.subMenuItemText}>{t('navigation.adminUsers')}</Text>
                  </Pressable>
                  <Pressable
                    testID="nav-item-admin-reports"
                    accessibilityRole="button"
                    onPress={() => {
                      onClose();
                      router.push('/(tabs)/admin/reports');
                    }}
                    style={({ pressed }) => [styles.subMenuItem, pressed && styles.pressed]}>
                    <Text style={styles.subMenuItemText}>{t('navigation.adminReports')}</Text>
                  </Pressable>
                  <Pressable
                    testID="nav-item-admin-contact-info"
                    accessibilityRole="button"
                    onPress={() => {
                      onClose();
                      router.push('/(tabs)/update-contact-info');
                    }}
                    style={({ pressed }) => [styles.subMenuItem, pressed && styles.pressed]}>
                    <Text style={styles.subMenuItemText}>{t('navigation.adminContactInfo')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
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
