import { Tabs } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      <Tabs.Screen name="explore" options={{ title: 'Pacientes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacto' }} />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index].name;

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
            backgroundColor: colors.background,
            paddingBottom: dynamicPaddingBottom,
          }
    ]}>
      {/* 1. HOME TAB */}
      <TouchableOpacity
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
          Inicio
        </Text>
      </TouchableOpacity>

      {/* 2. EXPLORE (PACIENTES) TAB */}
      <TouchableOpacity
        onPress={() => handleNavigate('explore')}
        style={styles.tabItem}>
        <Image
          source={require('@/assets/expo.icon/Assets/lista.svg')}
          style={styles.icon}
          tintColor={activeRouteName === 'explore' ? colors.main : colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: activeRouteName === 'explore' ? colors.main : colors.textSecondary },
          ]}>
          Pacientes
        </Text>
      </TouchableOpacity>

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          testID = 'center-btn'
          activeOpacity={0.8}
          style={[styles.floatingButton, { backgroundColor: colors.main }]}
          onPress={() => {
            console.log("Central Floating Button pressed");
          }}
        >
          <Image
            source={require('@/assets/expo.icon/Assets/plus-solid.svg')}
            style={styles.plusIcon}
            contentFit="contain"
            tintColor="white"
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
          Agenda
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
          Perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: Platform.OS === 'ios' ? 76 : 64,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  // We replaced the fixed spacer width with a layout wrapper for the floating button
  floatingButtonContainer: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingButton: {
    position: 'absolute',
    // Shifts the button upward out of the tabbar boundary slightly
    top: -50,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  plusIcon: {
    width: 18,
    height: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});