import React from 'react';
import AppTabs from '@/components/app-tabs';
import { NavigationMenuProvider } from '@/hooks/use-navigation-menu';

export default function TabsLayout() {
  return (
    <NavigationMenuProvider>
      <AppTabs />
    </NavigationMenuProvider>
  );
}
