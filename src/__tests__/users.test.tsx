import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AdminUserList from '@/app/(tabs)/admin/users';
import { USER_ROLES, LEGACY_ADMIN_ROLE } from '@/constants/user-roles';

// --- Mocks ---

const mockUpdate = jest.fn().mockResolvedValue(true);
const mockDoc = jest.fn(() => ({ update: mockUpdate }));
const mockEnableNetwork = jest.fn().mockResolvedValue(undefined);
let mockOnSnapshotCallback: (snapshot: any) => void;
let mockOnSnapshotErrorCallback: (error: any) => void;

const mockCollection = jest.fn(() => ({
  onSnapshot: jest.fn((onSuccess, onError) => {
    mockOnSnapshotCallback = onSuccess;
    mockOnSnapshotErrorCallback = onError;
    return jest.fn(); // Unsubscribe function
  }),
  doc: mockDoc,
}));

jest.mock('@/config/firebase', () => ({
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      enableNetwork: mockEnableNetwork,
    }),
    {
      collection: mockCollection,
      enableNetwork: mockEnableNetwork,
    }
  ),
}));

const mockCurrentUser = { uid: 'admin-123' };
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: mockCurrentUser,
  }),
}));

let mockIsConnected = true;
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({
    isConnected: mockIsConnected,
  }),
  refresh: jest.fn(),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageTitle: '#000000',
    pageSubtitle: '#666666',
    border: '#cccccc',
    backgroundElement: '#ffffff',
    text: '#000000',
    offlineBannerBackground: '#FEF3C7',
    offlineBannerBorder: '#F59E0B',
    offlineBannerText: '#92400E',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// UI Component Mocks
jest.mock('@/components/app-header', () => ({ AppHeader: () => null }));
jest.mock('@/components/breadcrumb', () => ({ Breadcrumb: () => null }));

jest.mock('@/components/users-list/search-filter-selector', () => {
  const { View, TextInput, Pressable, Text } = require('react-native');
  // Require USER_ROLES dynamically inside the mock factory to avoid hoisting issues
  const { USER_ROLES } = require('@/constants/user-roles');

  return {
    SearchFilter: ({ value, onChangeText, onChangeOrder, onToggleFilter }: any) => (
      <View testID="search-filter">
        <TextInput testID="search-input" value={value} onChangeText={onChangeText} />
        <Pressable testID="sort-name-btn" onPress={() => onChangeOrder('name')}>
          <Text>Sort Name</Text>
        </Pressable>
        <Pressable testID="sort-lastname-btn" onPress={() => onChangeOrder('lastname')}>
          <Text>Sort Lastname</Text>
        </Pressable>
        <Pressable testID="sort-invalid-btn" onPress={() => onChangeOrder('other')}>
          <Text>Sort Invalid</Text>
        </Pressable>
        <Pressable testID="filter-admin-btn" onPress={() => onToggleFilter('rol', USER_ROLES.ADMIN)}>
          <Text>Filter Admin</Text>
        </Pressable>
        <Pressable testID="filter-status-btn" onPress={() => onToggleFilter('estado', 'activo')}>
          <Text>Filter Status</Text>
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
  { id: '1', nombre: 'Alice Smith', email: 'alice@example.com', estado: 'activo', rol: USER_ROLES.ADMIN },
  { id: '2', nombre: 'Bob Jones', email: 'bob@example.com', estado: 'inactivo', rol: USER_ROLES.USER },
  { id: '3', nombre: 'Charlie Brown', email: 'charlie@example.com', estado: 'activo', rol: USER_ROLES.USER },
  { id: '4', nombre: 'Super Admin', email: 'admin@example.com', estado: 'activo', rol: LEGACY_ADMIN_ROLE },
  { id: '5', nombre: '', email: 'noname@example.com', estado: 'inactivo', rol: USER_ROLES.USER },
];

describe('AdminUserList Suite - Max Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
  });

  const emitFirestoreData = (data = mockUsersData) => {
    act(() => {
      mockOnSnapshotCallback({
        docs: data.map((user) => ({
          id: user.id,
          data: () => user,
        })),
        metadata: { fromCache: false },
      });
    });
  };

  // --- 1. Firestore Subscription & Error Handling ---

  it('handles firestore error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<AdminUserList />);

    act(() => {
      mockOnSnapshotErrorCallback(new Error('Firestore error'));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching users: ', expect.any(Error));
    consoleSpy.mockRestore();
  });

  // --- 2. Offline Banner & Retry Logic ---

  it('renders offline banner when network is disconnected and retries successfully', async () => {
    mockIsConnected = false;
    (NetInfo.refresh as jest.Mock).mockResolvedValueOnce({ isConnected: true });

    const { getByText } = render(<AdminUserList />);
    expect(getByText('contacts.offlineMode')).toBeTruthy();

    const retryBtn = getByText('Reintentar');
    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(NetInfo.refresh).toHaveBeenCalled();
    expect(mockEnableNetwork).toHaveBeenCalled();
  });

  it('shows alert when network retry fails to connect', async () => {
    mockIsConnected = false;
    const alertSpy = jest.spyOn(Alert, 'alert');
    (NetInfo.refresh as jest.Mock).mockResolvedValueOnce({ isConnected: false });

    const { getByText } = render(<AdminUserList />);
    const retryBtn = getByText('Reintentar');

    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(alertSpy).toHaveBeenCalledWith('Sin Conexión', 'Aún no hay acceso a internet.');
    expect(mockEnableNetwork).not.toHaveBeenCalled();
  });

  it('handles errors inside handleRetryConnection', async () => {
    mockIsConnected = false;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (NetInfo.refresh as jest.Mock).mockRejectedValueOnce(new Error('Network check error'));

    const { getByText } = render(<AdminUserList />);
    const retryBtn = getByText('Reintentar');

    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error retrying connection: ', expect.any(Error));
    consoleSpy.mockRestore();
  });

  // --- 3. Sorting & Name Missing Edge Cases ---

  it('sorts users by first name properly handling missing names', async () => {
    const { getByTestId, getAllByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    fireEvent.press(getByTestId('sort-name-btn'));

    await waitFor(() => {
      const cards = getAllByTestId(/user-card-/);
      expect(cards[0].props.testID).toBe('user-card-Alice Smith');
    });
  });

  it('handles default branch in sorting when orderBy is unknown', async () => {
    const { getByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    fireEvent.press(getByTestId('sort-invalid-btn'));

    await waitFor(() => {
      expect(getByTestId('user-card-Alice Smith')).toBeTruthy();
    });
  });

  // --- 4. Role & Status Filter Logic ---

  it('filters legacy admin roles properly', async () => {
    const { getByTestId, queryByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    // Filter by ADMIN
    fireEvent.press(getByTestId('filter-admin-btn'));

    await waitFor(() => {
      expect(getByTestId('user-card-Alice Smith')).toBeTruthy();
      expect(getByTestId('user-card-Super Admin')).toBeTruthy();
      expect(queryByTestId('user-card-Bob Jones')).toBeNull();
    });
  });

  it('toggles filter selections on and off', async () => {
    const { getByTestId, queryByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    // Toggle status active ON
    fireEvent.press(getByTestId('filter-status-btn'));
    await waitFor(() => {
      expect(queryByTestId('user-card-Bob Jones')).toBeNull();
    });

    // Toggle status active OFF
    fireEvent.press(getByTestId('filter-status-btn'));
    await waitFor(() => {
      expect(getByTestId('user-card-Bob Jones')).toBeTruthy();
    });
  });

  // --- 5. User Status Update Edge Cases & Errors ---

  it('toggles user status from inactivo to activo', async () => {
    const { getByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Bob Jones')).toBeTruthy());

    // Toggle Bob Jones (inactivo -> activo)
    fireEvent(getByTestId('switch-Bob Jones'), 'valueChange', true);

    expect(mockDoc).toHaveBeenCalledWith('2');
    expect(mockUpdate).toHaveBeenCalledWith({ estado: 'activo' });
  });

  it('shows alert when firestore status update throws an error', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdate.mockRejectedValueOnce(new Error('Update failed'));

    const { getByTestId } = render(<AdminUserList />);
    emitFirestoreData();

    await waitFor(() => expect(getByTestId('user-card-Alice Smith')).toBeTruthy());

    await act(async () => {
      fireEvent(getByTestId('switch-Alice Smith'), 'valueChange', false);
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'admin-users.errorUpdateUserStatus');
    consoleSpy.mockRestore();
  });

  // --- 6. Pagination Edge Cases ---

  it('resets current page to 0 when no users match search filter', async () => {
    const { getByTestId, getByText } = render(<AdminUserList />);
    emitFirestoreData();

    fireEvent.changeText(getByTestId('search-input'), 'NonExistentUserQuery123');

    await waitFor(() => {
      expect(getByTestId('no-results')).toBeTruthy();
      expect(getByText('Page: 0')).toBeTruthy();
    });
  });
});