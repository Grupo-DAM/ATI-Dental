import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchFilter, SelectableOption, FilterCategory } from '@/components/users-list/search-filter-selector';

// --- Mocks ---

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
        'patients-list.orderByLastVisit': 'Last Visit',
        'patients-list.orderByNextVisit': 'Next Visit',
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

// Dynamic Dropdown mock that allows triggering any option index
let mockDropdownCallback: (index: number) => void;
jest.mock('@/components/ui/dropdown-selector.tsx', () => {
  const { Pressable, Text } = require('react-native');
  return {
    DropdownSelector: ({ children, onChangeOption }: any) => {
      mockDropdownCallback = onChangeOption;
      return (
        <Pressable testID="dropdown-selector" onPress={() => onChangeOption(0)}>
          <Text>{children?.[0]}</Text>
        </Pressable>
      );
    },
  };
});

describe('SearchFilter Suite - Max Coverage', () => {
  const mockOnChangeText = jest.fn();
  const mockOnChangeOrder = jest.fn();
  const mockOnToggleFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. SelectableOption Coverage ---

  describe('SelectableOption Edge Cases', () => {
    it('renders with default props without crashing', () => {
      const mockPress = jest.fn();
      const { queryByTestId } = render(
        <SelectableOption onPress={mockPress} />
      );

      // Selected icon shouldn't be rendered when isSelected defaults to false
      expect(queryByTestId('expo-image')).toBeNull();
    });

    it('hides plus-icon image when isSelected is false', () => {
      const { queryByTestId } = render(
        <SelectableOption option="User" isSelected={false} onPress={jest.fn()} />
      );

      expect(queryByTestId('expo-image')).toBeNull();
    });
  });

  // --- 2. FilterCategory Coverage ---

  describe('FilterCategory Edge Cases', () => {
    it('renders with default title when omitted', () => {
      const { getByText } = render(
        <FilterCategory options={[]} onToggleOption={jest.fn()} />
      );

      expect(getByText('')).toBeTruthy();
    });

    it('handles options without a name property (fallback key)', () => {
      const options = [
        { db_value: 'val_1', name: '', active: false },
      ];

      const { getByText } = render(
        <FilterCategory title="Empty Names" options={options} onToggleOption={jest.fn()} />
      );

      expect(getByText('Empty Names')).toBeTruthy();
    });
  });

  // --- 3. SearchFilter General & Patient Modes ---

  describe('SearchFilter Modes & Default Parameters', () => {
    it('renders general/admin search label when general=true', () => {
      const { getByText } = render(
        <SearchFilter
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={[]}
          activeStatus={[]}
        />
      );

      expect(getByText('Search Users')).toBeTruthy();
    });

    it('renders patient search label when general=false', () => {
      const { getByText } = render(
        <SearchFilter
          general={false}
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={[]}
          activeStatus={[]}
        />
      );

      expect(getByText('Search Patients')).toBeTruthy();
    });
  });

  // --- 4. Sorting Branch Coverage (changeOrder) ---

  describe('SearchFilter Sorting Branches', () => {
    it('handles all order options for general mode', () => {
      render(
        <SearchFilter
          general={true}
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={[]}
          activeStatus={[]}
        />
      );

      // Index 0 -> 'name'
      mockDropdownCallback(0);
      expect(mockOnChangeOrder).toHaveBeenCalledWith('name');

      // Index 1 -> 'lastname'
      mockDropdownCallback(1);
      expect(mockOnChangeOrder).toHaveBeenCalledWith('lastname');

      // Index 2 -> 'id'
      mockDropdownCallback(2);
      expect(mockOnChangeOrder).toHaveBeenCalledWith('id');
    });

    it('handles additional patient-specific order options', () => {
      render(
        <SearchFilter
          general={false}
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={[]}
          activeStatus={[]}
        />
      );

      // Index 3 -> 'lastVisit'
      mockDropdownCallback(3);
      expect(mockOnChangeOrder).toHaveBeenCalledWith('lastVisit');

      // Index 4 -> 'nextVisit'
      mockDropdownCallback(4);
      expect(mockOnChangeOrder).toHaveBeenCalledWith('nextVisit');
    });
  });

  // --- 5. Filter Interaction Coverage ---

  describe('SearchFilter Interactivity & Toggle Panel', () => {
    it('triggers onToggleFilter when role and status filters are pressed', () => {
      const { getByTestId, getByText } = render(
        <SearchFilter
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={['ADMIN']}
          activeStatus={['activo']}
        />
      );

      // Open filter panel
      fireEvent.press(getByTestId('filter-toggle-btn'));

      // Click role option
      fireEvent.press(getByText('Admin'));
      expect(mockOnToggleFilter).toHaveBeenCalledWith('rol', 'ADMIN');

      // Click status option
      fireEvent.press(getByText('Active'));
      expect(mockOnToggleFilter).toHaveBeenCalledWith('estado', 'activo');
    });

    it('toggles filter panel open and close on press', () => {
      const { getByTestId, queryByText, getByText } = render(
        <SearchFilter
          value=""
          onChangeText={mockOnChangeText}
          onChangeOrder={mockOnChangeOrder}
          onToggleFilter={mockOnToggleFilter}
          activeRoles={[]}
          activeStatus={[]}
        />
      );

      const filterBtn = getByTestId('filter-toggle-btn');

      // Initially closed
      expect(queryByText('Filters')).toBeNull();

      // First press: Open
      fireEvent.press(filterBtn);
      expect(getByText('Filters')).toBeTruthy();

      // Second press: Close
      fireEvent.press(filterBtn);
      expect(queryByText('Filters')).toBeNull();
    });
  });
});