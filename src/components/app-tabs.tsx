import { Tabs } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { createTabBarStyles } from '@/constants/styles/global.styles';

export default function AppTabs() {
  const renderTabBar = useCallback((props: any) => <CustomTabBar {...props} />, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen name="home" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="patients/patients-list" options={{ title: 'Pacientes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="contacts" options={{ href: null, title: 'Contacto' }} />
      <Tabs.Screen name="patients/register-patient" options={{ href: null, title: 'Registrar Paciente' }} />
      <Tabs.Screen name="admin/users" options={{ href: null, title: 'Admin Usuarios' }} />
      <Tabs.Screen name="admin/reports" options={{ href: null, title: 'Admin Reportes' }} />
      <Tabs.Screen name="update-contact-info" options={{ href: null, title: 'Actualizar contacto' }} />
      <Tabs.Screen name="patients/register-treatment" options={{ href: null, title: 'Registrar Tratamiento' }} />
      <Tabs.Screen name="patient-file" options={{ href: null, title: 'Ficha de Paciente' }} />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colors = useTheme();
  const styles = useMemo(() => createTabBarStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const activeRouteName = state.routes[state.index].name;
  const isPatientsSection = activeRouteName === 'patients/patients-list' || activeRouteName === 'patients/register-patient' || activeRouteName === 'patient-file';

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  // Dynamic padding compensation for iOS gestures and Android navigation bars
  let dynamicPaddingBottom = 12;

  if (Platform.OS === 'ios') {
      dynamicPaddingBottom = insets.bottom > 0 ? insets.bottom : 24;
  } else {
      // Lógica para Android
      dynamicPaddingBottom = insets.bottom > 0 ? insets.bottom + 4 : 12;
  }

  return (
    <View
      testID='tabBar'
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.backgroundElement,
          paddingBottom: dynamicPaddingBottom,
          borderTopColor: colors.pageSeparator,
        }
    ]}>
      {/* 1. HOME TAB */}
      <TouchableOpacity
        testID="home-tab"
        onPress={() => handleNavigate('home')}
        style={styles.tabItem}
      >
        <Image
          source={require('@/assets/expo.icon/Assets/home.svg')}
          style={styles.icon}
          tintColor={activeRouteName === 'home' ? colors.main : colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: activeRouteName === 'home' ? colors.main : colors.textSecondary },
          ]}>
          {t('tabs.home')}
        </Text>
      </TouchableOpacity>

      {/* 2. EXPLORE (PACIENTES) TAB */}
      <TouchableOpacity
        testID="explore-tab"
        onPress={() => handleNavigate('patients/patients-list')}
        style={styles.tabItem}>
        <Image
          source={require('@/assets/expo.icon/Assets/lista.svg')}
          style={styles.icon}
          tintColor={isPatientsSection ? colors.main : colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: isPatientsSection ? colors.main : colors.textSecondary },
          ]}>
          {t('tabs.explore')}
        </Text>
      </TouchableOpacity>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          testID = 'center-btn'
          activeOpacity={0.8}
          style={[styles.floatingButton, { backgroundColor: colors.main }]}
          onPress={() => navigation.navigate('patient-file', { patientId: 'paciente_cova_123' })}
        >
          <Image
            source={require('@/assets/expo.icon/Assets/plus-solid.svg')}
            style={styles.plusIcon}
            contentFit="contain"
            tintColor={colors.overMain}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        disabled
        style={styles.tabItem}>
        <Image
          source={require('@/assets/expo.icon/Assets/agenda-pencil-left.svg')}
          style={styles.icon}
          tintColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('tabs.agenda')}
        </Text>
      </TouchableOpacity>

      {/* 5. PROFILE TAB */}
      <TouchableOpacity
        testID="profile-tab"
        onPress={() => handleNavigate('profile')}
        style={styles.tabItem}>
        <Image
          source={require('@/assets/expo.icon/Assets/user.svg')}
          style={styles.icon}
          tintColor={activeRouteName === 'profile' ? colors.main : colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: activeRouteName === 'profile' ? colors.main : colors.textSecondary },
          ]}>
          {t('tabs.profile')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}