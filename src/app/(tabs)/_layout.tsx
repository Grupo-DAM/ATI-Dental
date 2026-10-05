import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import AppTabs from '@/components/app-tabs';
import { NavigationMenuProvider } from '@/hooks/use-navigation-menu';
import { useAuth } from '@/hooks/use-auth';

export default function TabsLayout() {
  const { user, loading, recordActivity } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user || user.estado === 'inactivo') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container} onTouchStart={recordActivity}>
      <NavigationMenuProvider>
        <AppTabs />
      </NavigationMenuProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
