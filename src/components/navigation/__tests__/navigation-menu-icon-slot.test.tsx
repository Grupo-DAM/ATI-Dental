import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { NavigationMenuIconSlot } from '@/components/navigation/navigation-menu-icon-slot';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('NavigationMenuIconSlot', () => {
  it('renderiza children si se pasan', () => {
    render(
      <NavigationMenuIconSlot iconKey="patients">
        <Text>custom</Text>
      </NavigationMenuIconSlot>,
    );
    expect(screen.getByText('custom')).toBeTruthy();
  });

  it('acepta source para el svg', () => {
    render(<NavigationMenuIconSlot iconKey="profile" source={1} />);
    expect(screen.getByTestId('nav-icon-slot-profile')).toBeTruthy();
  });
});
