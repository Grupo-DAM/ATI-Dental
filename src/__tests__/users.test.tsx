import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminUserList from '@/app/(tabs)/admin/users'; // Adjust import path

// --- Mocks ---

const mockUpdate = jest.fn().mockResolvedValue(true);
const mockDoc = jest.fn(() => ({ update: mockUpdate }));
let mockOnSnapshotCallback: (snapshot: any) => void;

const mockCollection = jest.fn(() => ({
  onSnapshot: jest.fn((callback) => {
    mockOnSnapshotCallback = callback;
    return jest.fn(); // Unsubscribe function
  }),
  doc: mockDoc,
}));

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: mockCollection,
  }),
}));

const mockCurrentUser = { uid: 'admin-123' };
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: mockCurrentUser,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageTitle: '#000000',
    pageSubtitle: '#666666',
    border: '#cccccc',
    backgroundElement: '#ffffff',
    text: '#000000',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// UI Component Mocks
jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@/components/breadcrumb', () => ({
  Breadcrumb: () => null,
}));

jest.mock('@/components/users-list/search-filter-selector', () => {
  const { View, TextInput, Pressable, Text } = require('react-native');
  return {
    SearchFilter: ({ value, onChangeText, onChangeOrder, onToggleFilter }: any) => (
      <View testID="search-filter">
        <TextInput
          testID="search-input"
          value={value}
          onChangeText={onChangeText}
        />
        <Pressable testID="sort-lastname-btn" onPress={() => onChangeOrder('lastname')}>
          <Text>Sort Lastname</Text>
        </Pressable>
        <Pressable testID="filter-admin-btn" onPress={() => onToggleFilter('rol', 'ADMIN')}>
          <Text>Filter Admin</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/components/users-list/user-card', () => {
  const { View, Text, Switch } = require('react-native');
  return {
    UserCard: ({ name, email, status, switchStatus }: any) => (
      <View testID={`user-card-${name}`}>
        <Text>{name}</Text>
        <Text>{email}</Text>
        <Switch testID={`switch-${name}`} value={status} onValueChange={switchStatus} />
      </View>
    ),
  };
});

jest.mock('@/components/users-list/no-results', () => {
  const { View, Text } = require('react-native');
  return {
    NoResultSearch: () => (
      <View testID="no-results">
        <Text>No results found</Text>
      </View>
    ),
  };
});

jest.mock('@/components/users-list/list-pages-viewer', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    ListPages: ({ currentPage, onPageChange }: any) => (
      <View testID="list-pages">
        <Text>Page: {currentPage}</Text>
        <Pressable testID="next-page-btn" onPress={() => onPageChange(currentPage + 1)}>
          <Text>Next</Text>
        </Pressable>
      </View>
    ),
  };
});

// --- Mock Data ---

const mockUsersData = [
  { id: '1', nombre: 'Alice Smith', email: 'alice@example.com', estado: 'activo', rol: 'ADMIN' },
  { id: '2', nombre: 'Bob Jones', email: 'bob@example.com', estado: 'inactivo', rol: 'USER' },
  { id: '3', nombre: 'Charlie Brown', email: 'charlie@example.com', estado: 'activo', rol: 'USER' },
];

describe('AdminUserList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const emitFirestoreData = (data = mockUsersData) => {
    mockOnSnapshotCallback({
      docs: data.map((doc) => ({
        id: doc.id,
        data: () => doc,
      })),
      metadata: { fromCache: false },
    });
  };

  it('fetches and renders list of users from firestore', async () => {
    const { getByTestId, getByText } = render(<AdminUserList />);

    // Simulate Firestore emitting data
    emitFirestoreData();

    await waitFor(() => {
      expect(getByTestId('user-card-Alice Smith')).toBeTruthy();
      expect(getByTestId('user-card-Bob Jones')).toBeTruthy();
      expect(getByText('alice@example.com')).toBeTruthy();
    });
  });

  it('displays NoResultSearch when firestore returns no matching users', async () => {
    const { getByTestId, queryByTestId } = render(<AdminUserList />);

    emitFirestoreData([]);

    await waitFor(() => {
      expect(getByTestId('no-results')).toBeTruthy();
      expect(queryByTestId('user-card-Alice Smith')).toBeNull();
    });
  });

  it('filters users by search query', async () => {
    const { getByTestId, queryByTestId } = render(<AdminUserList />);

    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Alice Smith')).toBeTruthy());

    // Filter by name "Alice"
    fireEvent.changeText(getByTestId('search-input'), 'Alice');

    await waitFor(() => {
      expect(getByTestId('user-card-Alice Smith')).toBeTruthy();
      expect(queryByTestId('user-card-Bob Jones')).toBeNull();
    });
  });

  it('filters users by role when filter is toggled', async () => {
    const { getByTestId, queryByTestId } = render(<AdminUserList />);

    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Bob Jones')).toBeTruthy());

    // Toggle filter for ADMIN role
    fireEvent.press(getByTestId('filter-admin-btn'));

    await waitFor(() => {
      expect(getByTestId('user-card-Alice Smith')).toBeTruthy();
      expect(queryByTestId('user-card-Bob Jones')).toBeNull();
    });
  });

  it('sorts users by last name when selected', async () => {
    const { getByTestId, getAllByTestId } = render(<AdminUserList />);

    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Alice Smith')).toBeTruthy());

    // Sort by last name (Brown < Jones < Smith)
    fireEvent.press(getByTestId('sort-lastname-btn'));

    await waitFor(() => {
      const cards = getAllByTestId(/user-card-/);
      expect(cards[0].props.testID).toBe('user-card-Charlie Brown');
      expect(cards[1].props.testID).toBe('user-card-Bob Jones');
      expect(cards[2].props.testID).toBe('user-card-Alice Smith');
    });
  });

  it('updates user status in Firestore when toggle switch is pressed', async () => {
    const { getByTestId } = render(<AdminUserList />);

    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Alice Smith')).toBeTruthy());

    // Toggle active status for Alice Smith (activo -> inactivo)
    fireEvent(getByTestId('switch-Alice Smith'), 'valueChange', false);

    expect(mockDoc).toHaveBeenCalledWith('1');
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'inactivo' });
  });

  it('shows alert if unauthenticated user attempts to update status', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    // Temporarily remove currentUser
    const authModule = require('@react-native-firebase/auth');
    jest.spyOn(authModule, 'default').mockReturnValueOnce({ currentUser: null });

    const { getByTestId } = render(<AdminUserList />);

    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Alice Smith')).toBeTruthy());

    fireEvent(getByTestId('switch-Alice Smith'), 'valueChange', false);

    expect(alertSpy).toHaveBeenCalledWith(
      'Acceso Denegado',
      'Debes iniciar sesión para realizar modificaciones.'
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});