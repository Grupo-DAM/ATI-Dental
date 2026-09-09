import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { NavigationMenuProvider, useNavigationMenu } from '@/hooks/use-navigation-menu';

jest.mock('@/components/navigation/navigation-drawer', () => {
  const { Text } = require('react-native');
  return {
    NavigationDrawer: ({ visible }: { visible: boolean }) =>
      visible ? <Text testID="mocked-drawer">open</Text> : null,
  };
});

function Probe() {
  const menu = useNavigationMenu();
  return (
    <>
      <Text testID="menu-state">{menu?.isOpen ? 'open' : 'closed'}</Text>
      <Text testID="open-menu" onPress={() => menu?.open()}>
        open
      </Text>
      <Text testID="close-menu" onPress={() => menu?.close()}>
        close
      </Text>
    </>
  );
}

describe('useNavigationMenu', () => {
  it('devuelve undefined fuera del provider', () => {
    function Outside() {
      const menu = useNavigationMenu();
      return <Text testID="outside">{menu ? 'yes' : 'no'}</Text>;
    }

    render(<Outside />);
    expect(screen.getByTestId('outside').props.children).toBe('no');
  });

  it('abre y cierra el menú', () => {
    render(
      <NavigationMenuProvider>
        <Probe />
      </NavigationMenuProvider>,
    );

    expect(screen.getByTestId('menu-state').props.children).toBe('closed');
    expect(screen.queryByTestId('mocked-drawer')).toBeNull();

    fireEvent.press(screen.getByTestId('open-menu'));
    expect(screen.getByTestId('menu-state').props.children).toBe('open');
    expect(screen.getByTestId('mocked-drawer')).toBeTruthy();

    fireEvent.press(screen.getByTestId('close-menu'));
    expect(screen.getByTestId('menu-state').props.children).toBe('closed');
    expect(screen.queryByTestId('mocked-drawer')).toBeNull();
  });
});
