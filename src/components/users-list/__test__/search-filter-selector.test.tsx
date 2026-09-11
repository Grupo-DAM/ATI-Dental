import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchFilter, SelectableOption, FilterCategory } from '@/components/users-list/search-filter-selector';

// Mock native hooks and modules
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#000000',
    border: '#cccccc',
    backgroundElement: '#ffffff',
    textNames: '#111111',
    placeholderColor: '#999999',
    backgroundSelected: '#e0e0e0',
    main: '#6200ee',
    breadcrumbSeparator: '#888888',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin-users.searchUsers': 'Search Users',
        'patients-list.searchPatients': 'Search Patients',
        'admin-users.searchUserPlaceholder': 'Search...',
        'admin-users.orderBy': 'Order By',
        'admin-users.orderByName': 'Name',
        'admin-users.orderByLastName': 'Last Name',
        'admin-users.orderByID': 'ID',
        'admin-users.filterByRole': 'Filter by Role',
        'admin-users.filterByStatus': 'Filter by Status',
        'admin-users.activeStatus': 'Active',
        'admin-users.inactiveStatus': 'Inactive',
        'admin-users.filters': 'Filters',
        'roles.admin': 'Admin',
        'roles.user': 'User',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/constants/user-roles', () => ({
  USER_ROLES: {
    ADMIN: 'ADMIN',
    USER: 'USER',
  },
  getRoleLabelKey: (role: string) => `roles.${role.toLowerCase()}`,
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.mock('@/components/ui/dropdown-selector.tsx', () => {
  const { Pressable, Text } = require('react-native');
  return {
    DropdownSelector: ({ children, onChangeOption }: any) => (
      <Pressable testID="dropdown-selector" onPress={() => onChangeOption(1)}>
        <Text>{children?.[0]}</Text>
      </Pressable>
    ),
  };
});

describe('SearchFilter Component and Sub-components', () => {
  const mockOnChangeText = jest.fn();
  const mockOnChangeOrder = jest.fn();
  const mockOnToggleFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SelectableOption', () => {
    it('renders option name and handles press', () => {
      const mockOnPress = jest.fn();
      const { getByText } = render(
        <SelectableOption option="Admin" isSelected={false} onPress={mockOnPress} />
      );

      expect(getByText('Admin')).toBeTruthy();
      fireEvent.press(getByText('Admin'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('renders selection icon when selected', () => {
      const { getByTestId } = render(
        <SelectableOption option="Admin" isSelected={true} onPress={jest.fn()} />
      );

      expect(getByTestId('expo-image')).toBeTruthy();
    });
  });

  describe('FilterCategory', () => {
    it('renders title and option list', () => {
      const mockToggle = jest.fn();
      const options = [
        { db_value: 'ADMIN', name: 'Admin', active: true },
        { db_value: 'USER', name: 'User', active: false },
      ];

      const { getByText } = render(
        <FilterCategory title="Role Category" options={options} onToggleOption={mockToggle} />
      );

      expect(getByText('Role Category')).toBeTruthy();
      expect(getByText('Admin')).toBeTruthy();
      expect(getByText('User')).toBeTruthy();

      fireEvent.press(getByText('User'));
      expect(mockToggle).toHaveBeenCalledWith('USER');
    });
  });

  describe('SearchFilter', () => {
    it('renders search input and triggers onChangeText', () => {
      const { getByPlaceholderText } = render(
        <SearchFilter
          value="john"
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          activeRoles={[]}
          activeStatus={[]}
          onToggleFilter={mockOnToggleFilter}
        />
      );

      const input = getByPlaceholderText('Search...');
      expect(input.props.value).toBe('john');

      fireEvent.changeText(input, 'jane');
      expect(mockOnChangeText).toHaveBeenCalledWith('jane');
    });

    it('changes order when dropdown option is selected', () => {
      const { getByTestId } = render(
        <SearchFilter
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          activeRoles={[]}
          activeStatus={[]}
          onToggleFilter={mockOnToggleFilter}
        />
      );

      fireEvent.press(getByTestId('dropdown-selector'));
      // Index 1 maps to 'lastname' in changeOrder
      expect(mockOnChangeOrder).toHaveBeenCalledWith('lastname');
    });

    it('expands filter panel when filter button is pressed', () => {
      const { getByText, queryByText, getByTestId } = render(
        <SearchFilter
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          activeRoles={['ADMIN']}
          activeStatus={['activo']}
          onToggleFilter={mockOnToggleFilter}
        />
      );

      // Filters hidden by default
      expect(queryByText('Filters')).toBeNull();

      // Press toggle button via testID (lowercase 'd')
      fireEvent.press(getByTestId('filter-toggle-btn'));

      // Filter panel should now be visible
      expect(getByText('Filters')).toBeTruthy();
      expect(getByText('Filter by Role')).toBeTruthy();
      expect(getByText('Filter by Status')).toBeTruthy();
    });
  });
});