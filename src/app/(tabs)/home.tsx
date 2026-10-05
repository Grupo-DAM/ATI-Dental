import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { PageTitleLayout } from '@/components/page-title-layout';
import { CardContainer } from '@/components/ui/card-container';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { createStyles } from '@/constants/styles/home.styles';
import {
  fetchDashboardSummary,
  fetchQuickAccessItems,
  saveQuickAccessPreferences,
  fetchNotifications,
  markNotificationAsRead,
  performGlobalSearch,
  DashboardSummary,
  QuickAccessItem,
  NotificationItem,
  SearchResultItem,
  ALL_QUICK_ACCESS_ITEMS,
} from '@/services/dashboard-service';

const CATEGORY_ICON_MAP: Record<string, any> = {
  patients: 'person-outline',
  appointments: 'calendar-outline',
  treatments: 'medkit-outline',
  modules: 'grid-outline',
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const netInfo = useNetInfo();
  const router = useRouter();
  const { user } = useAuth();

  // ─── Dashboard State ───
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [quickAccessList, setQuickAccessList] = useState<QuickAccessItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Search State ───
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFocused, setSearchFocused] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // ─── Modals State (Escenario 3 & 4) ───
  const [customizeModalVisible, setCustomizeModalVisible] = useState<boolean>(false);
  const [selectedQuickAccessIds, setSelectedQuickAccessIds] = useState<string[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const userUid = user?.uid;
  const userRole = user?.rol;

  // ─── Load Dashboard Data ───
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, quick, notifs] = await Promise.all([
        fetchDashboardSummary(user),
        fetchQuickAccessItems(user),
        fetchNotifications(user),
      ]);
      setSummary(sum);
      setQuickAccessList(quick);
      setNotifications(notifs);
    } catch (err: any) {
      setError(err?.message || t('home.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sum, quick, notifs] = await Promise.all([
          fetchDashboardSummary(user),
          fetchQuickAccessItems(user),
          fetchNotifications(user),
        ]);
        if (isMounted) {
          setSummary(sum);
          setQuickAccessList(quick);
          setNotifications(notifs);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || t('home.errorLoading'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userUid, userRole]);

  // ─── Search with Debounce ───
  const DEBOUNCE_MS = process.env.NODE_ENV === 'test' ? 10 : 300;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await performGlobalSearch(searchQuery, user);
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, userUid, userRole, DEBOUNCE_MS]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultPress = (item: SearchResultItem) => {
    setSearchQuery('');
    setSearchResults([]);
    router.push(item.route as any);
  };

  // ─── Quick Access Customization (Escenario 3) ───
  const handleOpenCustomize = () => {
    setSelectedQuickAccessIds(quickAccessList.map((item) => item.id));
    setCustomizeModalVisible(true);
  };

  const handleToggleQuickAccessItem = (id: string) => {
    setSelectedQuickAccessIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSaveCustomization = () => {
    setCustomizeModalVisible(false);
    const userRole = user?.rol || 'odontologo';
    saveQuickAccessPreferences(userRole, selectedQuickAccessIds)
      .then(() => fetchQuickAccessItems(user))
      .then((updated) => {
        setQuickAccessList(updated);
      })
      .catch((err) => {
        console.warn('Error saving quick access preferences:', err);
      });
  };

  // ─── Notification Click (Escenario 4) ───
  const handleNotificationPress = async (notif: NotificationItem) => {
    setSelectedNotification(notif);
    setNotificationModalVisible(true);
    if (!notif.read) {
      const updated = await markNotificationAsRead(notif.id);
      setNotifications(updated);
    }
  };

  const handleNotificationAction = () => {
    if (selectedNotification?.targetRoute) {
      const route = selectedNotification.targetRoute;
      setNotificationModalVisible(false);
      router.push(route as any);
    } else {
      setNotificationModalVisible(false);
    }
  };

  // Greeting name
  const greetingName = user?.nombre || t('home.defaultName');
  const isOffline = netInfo.isConnected === false || summary?.fromCache;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageTitleLayout
      currentBreadcrumbKey="tabs.home"
      scrollContainerStyle={styles.scrollContent}
      modals={
        <>
          {/* Quick Access Customization Modal (Escenario 3) */}
          <Modal
            visible={customizeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCustomizeModalVisible(false)}
          >
            {customizeModalVisible && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{t('home.customizeQuickAccess')}</Text>
                    <TouchableOpacity
                      testID="close-customize-modal"
                      onPress={() => setCustomizeModalVisible(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  <View>
                    {ALL_QUICK_ACCESS_ITEMS.filter((item) =>
                      item.allowedRoles.includes(user?.rol || 'odontologo')
                    ).map((item) => {
                      const isSelected = selectedQuickAccessIds.includes(item.id);
                      return (
                        <TouchableOpacity
                          key={item.id}
                          testID={`toggle-quick-${item.id}`}
                          style={styles.modalItemRow}
                          onPress={() => handleToggleQuickAccessItem(item.id)}
                        >
                          <View style={styles.modalItemLeft}>
                            <Ionicons name={item.icon as any} size={20} color={theme.main} />
                            <Text style={styles.modalItemText}>{t(item.labelKey)}</Text>
                          </View>
                          <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxActive]}>
                            {isSelected && <Ionicons name="checkmark" size={16} color={theme.overMain} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalSecondaryButton}
                      onPress={() => setCustomizeModalVisible(false)}
                    >
                      <Text style={styles.modalSecondaryButtonText}>{t('home.close')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID="save-customization-btn"
                      style={styles.modalPrimaryButton}
                      onPress={handleSaveCustomization}
                    >
                      <Text style={styles.modalPrimaryButtonText}>{t('home.save')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Modal>

          {/* Notification Detail Modal (Escenario 4) */}
          <Modal
            visible={notificationModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setNotificationModalVisible(false)}
          >
            {notificationModalVisible && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
                    <TouchableOpacity
                      testID="close-notification-modal"
                      onPress={() => setNotificationModalVisible(false)}
                      style={styles.modalCloseBtn}
                    >
                      <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                  <View>
                    <Text style={styles.modalItemText}>{selectedNotification?.subtitle}</Text>
                    {Boolean(selectedNotification?.date) && (
                      <Text style={styles.searchResultSubtitle}>{selectedNotification?.date}</Text>
                    )}
                  </View>
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalSecondaryButton}
                      onPress={() => setNotificationModalVisible(false)}
                    >
                      <Text style={styles.modalSecondaryButtonText}>{t('home.close')}</Text>
                    </TouchableOpacity>
                    {Boolean(selectedNotification?.targetRoute) && (
                      <TouchableOpacity
                        testID="go-to-notification-target-btn"
                        style={styles.modalPrimaryButton}
                        onPress={handleNotificationAction}
                      >
                        <Text style={styles.modalPrimaryButtonText}>{t('home.viewAgenda')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </Modal>
        </>
      }
    >
      {/* ── Offline Banner (Escenario 5) ── */}
      {isOffline && (
        <View testID="offline-banner" style={styles.offlineBanner}>
          <View style={styles.offlineBannerLeft}>
            <Ionicons
              name="cloud-offline-outline"
              size={18}
              color={theme.offlineBannerText || '#B45309'}
              style={styles.offlineBannerIcon}
            />
            <Text style={styles.offlineText}>{t('home.offlineDesc')}</Text>
          </View>
          <TouchableOpacity
            testID="retry-load-button"
            style={styles.retryButton}
            onPress={loadDashboardData}
          >
            <Text style={styles.retryButtonText}>{t('home.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Error Banner (Escenario 5) ── */}
      {error && !isOffline && (
        <View testID="error-banner" style={styles.offlineBanner}>
          <View style={styles.offlineBannerLeft}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.error} style={styles.offlineBannerIcon} />
            <Text style={styles.offlineText}>{error}</Text>
          </View>
          <TouchableOpacity
            testID="retry-error-button"
            style={styles.retryButton}
            onPress={loadDashboardData}
          >
            <Text style={styles.retryButtonText}>{t('home.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Greeting Header ── */}
      <View testID="welcome-header" style={styles.greetingSection}>
        <View style={styles.greetingLeft}>
          <Image
            source={require('@/assets/expo.icon/Assets/avatar.png')}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.greetingTextContainer}>
            <Text testID="greeting-title" style={styles.greetingTitle}>
              {t('home.greeting', { name: greetingName })}
            </Text>
            <Text style={styles.greetingSubtitle}>{t('home.welcomeBack')}</Text>
          </View>
        </View>
        <Pressable
          testID="customize-quick-access-btn"
          style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
          onPress={handleOpenCustomize}
        >
          <Ionicons name="pencil-outline" size={20} color={theme.text} />
        </Pressable>
      </View>

      {/* ── General Search Bar (Escenario 2) ── */}
      <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          testID="home-search-input"
          style={styles.searchInput}
          placeholder={t('home.searchPlaceholder')}
          placeholderTextColor={theme.placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {Boolean(searchQuery) && (
          <TouchableOpacity testID="clear-search-btn" onPress={handleClearSearch} style={styles.clearSearchButton}>
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search Results Dropdown (Escenario 2) ── */}
      {Boolean(searchQuery.trim()) && (
        <View testID="search-results-container" style={styles.searchResultsWrapper}>
          <Text style={styles.searchResultsTitle}>{t('home.searchResults')}</Text>
          {isSearching ? (
            <ActivityIndicator size="small" color={theme.main} />
          ) : searchResults.length > 0 ? (
            searchResults.map((item) => (
              <Pressable
                key={item.id}
                testID={`search-result-${item.id}`}
                style={({ pressed }) => [styles.searchResultItem, pressed && styles.searchResultItemPressed]}
                onPress={() => handleSearchResultPress(item)}
              >
                <Ionicons
                  name={CATEGORY_ICON_MAP[item.category] || 'grid-outline'}
                  size={20}
                  color={theme.main}
                  style={styles.searchResultIcon}
                />
                <View style={styles.searchResultTextCol}>
                  <Text style={styles.searchResultTitle}>{item.title}</Text>
                  <Text style={styles.searchResultSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </Pressable>
            ))
          ) : (
            <Text testID="no-search-results" style={styles.noResultsText}>
              {t('home.noResults', { query: searchQuery })}
            </Text>
          )}
        </View>
      )}

      {/* ── Section 1: Resumen de hoy (Escenario 1) ── */}
      <CardContainer wrapperStyle={styles.sectionCardWrapper} cardStyle={styles.sectionCardInner}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('home.todaySummary')}</Text>
          <TouchableOpacity
            testID="view-agenda-link"
            style={styles.agendaLink}
            onPress={() => router.push('/(tabs)/agenda')}
          >
            <Text style={styles.agendaLinkText}>{t('home.viewAgenda')}</Text>
          </TouchableOpacity>
        </View>

        {loading && !summary ? (
          <View testID="summary-skeleton" style={styles.skeletonRow}>
            <View style={styles.skeletonBox} />
            <View style={styles.skeletonBox} />
            <View style={styles.skeletonBox} />
          </View>
        ) : (
          <View style={styles.metricsRow}>
            {/* Citas pendientes */}
            <View testID="metric-citas" style={[styles.metricCard, styles.metricCardGreen]}>
              <Text style={[styles.metricNumber, styles.metricNumberGreen]}>
                {summary?.pendingAppointments ?? 0}
              </Text>
              <Text style={[styles.metricLabel, styles.metricLabelGreen]}>
                {t('home.pendingAppointments')}
              </Text>
            </View>

            {/* Pacientes pendientes */}
            <View testID="metric-pacientes" style={[styles.metricCard, styles.metricCardOrange]}>
              <Text style={[styles.metricNumber, styles.metricNumberOrange]}>
                {summary?.pendingPatients ?? 0}
              </Text>
              <Text style={[styles.metricLabel, styles.metricLabelOrange]}>
                {t('home.pendingPatients')}
              </Text>
            </View>

            {/* Examenes pendientes */}
            <View testID="metric-examenes" style={[styles.metricCard, styles.metricCardBlue]}>
              <Text style={[styles.metricNumber, styles.metricNumberBlue]}>
                {summary?.pendingExams ?? 0}
              </Text>
              <Text style={[styles.metricLabel, styles.metricLabelBlue]}>
                {t('home.pendingExams')}
              </Text>
            </View>
          </View>
        )}
      </CardContainer>

      {/* ── Section 2: Accesos rápidos (Escenario 1 & 3) ── */}
      <CardContainer wrapperStyle={styles.sectionCardWrapper} cardStyle={styles.sectionCardInner}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>
        </View>

        {loading && quickAccessList.length === 0 ? (
          <View testID="quick-access-skeleton" style={styles.skeletonRow}>
            <View style={styles.skeletonBox} />
            <View style={styles.skeletonBox} />
            <View style={styles.skeletonBox} />
          </View>
        ) : (
          <View style={styles.quickAccessRow}>
            {quickAccessList.map((item) => (
              <Pressable
                key={item.id}
                testID={`quick-access-${item.id}`}
                style={({ pressed }) => [styles.quickAccessButton, pressed && styles.quickAccessButtonPressed]}
                onPress={() => router.push(item.route as any)}
              >
                <Ionicons name={item.icon as any} size={24} color={theme.main} />
                <Text style={styles.quickAccessLabel}>{t(item.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </CardContainer>

      {/* ── Section 3: Notificaciones (Escenario 1 & 4) ── */}
      <CardContainer wrapperStyle={styles.sectionCardWrapper} cardStyle={styles.sectionCardInner}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('home.notifications')}</Text>
          {unreadCount > 0 && (
            <View testID="unread-badge" style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {loading && notifications.length === 0 ? (
          <View testID="notifications-skeleton" style={styles.skeletonNotification} />
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <Pressable
              key={notif.id}
              testID={`notification-item-${notif.id}`}
              style={({ pressed }) => [styles.notificationRow, pressed && styles.notificationRowPressed]}
              onPress={() => handleNotificationPress(notif)}
            >
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIconWrapper}>
                  <Ionicons name="notifications-outline" size={22} color={theme.main} />
                </View>
                <View style={styles.notificationTextCol}>
                  <Text style={styles.notificationTitle}>{notif.title}</Text>
                  <Text style={styles.notificationSubtitle}>{notif.subtitle}</Text>
                </View>
              </View>
              <View style={styles.notificationRight}>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.noResultsText}>{t('home.noNotifications')}</Text>
        )}
      </CardContainer>
    </PageTitleLayout>
  );
}