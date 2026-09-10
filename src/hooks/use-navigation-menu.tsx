import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { NavigationDrawer } from '@/components/navigation/navigation-drawer';

type NavigationMenuContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const NavigationMenuContext = createContext<NavigationMenuContextValue | undefined>(undefined);

export function NavigationMenuProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      open,
      close,
    }),
    [isOpen, open, close],
  );

  return (
    <NavigationMenuContext.Provider value={value}>
      {children}
      <NavigationDrawer visible={isOpen} onClose={close} />
    </NavigationMenuContext.Provider>
  );
}

export function useNavigationMenu(): NavigationMenuContextValue | undefined {
  return useContext(NavigationMenuContext);
}
