import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="explore" options={{ title: 'Pacientes' }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
      </Tabs>
    );
  }

function CustomTabBar({ state, descriptors, navigation }: any) {
  const colors = useTheme();
  const activeRouteName = state.routes[state.index].name;
  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        onPress={() => handleNavigate('home')}
        style={styles.tabItem}
      >
        <Image
          source={require('../../assets/expo.icon/Assets/home.svg')}
          style={styles.icon}
          tintColor={activeRouteName === 'index' ? colors.main : colors.textSecondary}
        />
        <Text
          style={[
            styles.label,
            { color: activeRouteName === 'index' ? colors.main : colors.textSecondary },
          ]}>
          Inicio
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleNavigate('explore')}
        style={styles.tabItem}>
        <Image
          source={require('../../assets/expo.icon/Assets/lista.svg')}
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
      <View style={styles.tabItemSpacer} />
      <TouchableOpacity
        disabled
        style={styles.tabItem}>
        <Image
          source={require('../../assets/expo.icon/Assets/agenda-pencil-left.svg')}
          style={styles.icon}
          tintColor={colors.textSecondary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Agenda
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="profile-tab"
        onPress={() => handleNavigate('profile')}
        style={styles.tabItem}>
        <Image
          source={require('../../assets/expo.icon/Assets/user.svg')}
          style={styles.icon}
          tintColor={activeRouteName === 'profile' ? colors.main : colors.textSecondary}/>
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
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 10,
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
  tabItemSpacer: {
    width: 68,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});