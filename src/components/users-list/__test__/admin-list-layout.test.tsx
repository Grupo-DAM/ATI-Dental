import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';

// Mocks de hooks y dependencias
const mockUseNetInfo = jest.fn();

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mockUseNetInfo(),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ main: '#6200ee' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mocks de componentes UI
jest.mock('@/components/app-header', () => ({ AppHeader: () => null }));
jest.mock('@/components/breadcrumb', () => ({ Breadcrumb: () => null }));
jest.mock('@/components/themed-view', () => {
  const { View } = require('react-native');
  return { ThemedView: ({ children, testID, style }: any) => <View testID={testID} style={style}>{children}</View> };
});
jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return { ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text> };
});

jest.mock('@/components/offline-banner', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    OfflineBanner: ({ onRetry }: any) => (
      <View testID="offline-banner">
        <Pressable testID="retry-button" onPress={onRetry}>
          <Text>Retry</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('@/components/users-list/search-filter-selector', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    SearchFilter: ({ onChangeText, onChangeOrder }: any) => (
      <View testID="search-filter">
        <Pressable testID="change-text-btn" onPress={() => onChangeText('search query')} />
        <Pressable testID="change-order-btn" onPress={() => onChangeOrder('asc')} />
      </View>
    ),
  };
});

jest.mock('@/components/users-list/list-pages-viewer', () => {
  const { View, Pressable } = require('react-native');
  return {
    ListPages: ({ onPageChange }: any) => (
      <View testID="list-pages">
        <Pressable testID="change-page-btn" onPress={() => onPageChange(2)} />
      </View>
    ),
  };
});

jest.mock('@/components/users-list/no-results', () => {
  const { Text } = require('react-native');
  return { NoResultSearch: () => <Text testID="no-results">No Results</Text> };
});

describe('AdminListLayout', () => {
  const defaultFilter = {
    searchQuery: '',
    setSearchQuery: jest.fn(),
    setCurrentPage: jest.fn(),
    setOrderBy: jest.fn(),
    selectedRoles: [],
    selectedStatus: [],
    handleToggleFilter: jest.fn(),
    filteredData: [{ id: '1' }, { id: '2' }],
    maxRange: 10,
    minRange: 1,
    currentPage: 1,
    totalPages: 1,
  };

  const defaultProps = {
    titleKey: 'title.key',
    subtitleKey: 'subtitle.key',
    parentBreadcrumbKey: 'parent.key',
    currentBreadcrumbKey: 'current.key',
    accessDeniedTitleKey: 'denied.title',
    accessDeniedDescKey: 'denied.desc',
    authLoading: false,
    hasPermission: true,
    isRetrying: false,
    handleRetryConnection: jest.fn(),
    filter: defaultFilter,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetInfo.mockReturnValue({ isConnected: true });
  });

  it('renderiza el loader cuando authLoading es verdadero', () => {
    const { UNSAFE_getByType } = render(
      <AdminListLayout {...defaultProps} authLoading={true}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    expect(UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
  });

  it('renderiza la vista de acceso denegado cuando hasPermission es falso', () => {
    const { getByText, queryByText } = render(
      <AdminListLayout {...defaultProps} hasPermission={false}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    expect(getByText('denied.title')).toBeTruthy();
    expect(getByText('denied.desc')).toBeTruthy();
    expect(queryByText('Children Content')).toBeNull();
  });

  it('renderiza el contenido principal y sus children en estado normal', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <AdminListLayout {...defaultProps} testID="custom-layout">
        <Text testID="child-item">Item Child</Text>
      </AdminListLayout>
    );

    expect(getByTestId('custom-layout')).toBeTruthy();
    expect(getByText('title.key')).toBeTruthy();
    expect(getByText('subtitle.key')).toBeTruthy();
    expect(getByTestId('child-item')).toBeTruthy();
    expect(queryByTestId('offline-banner')).toBeNull();
    expect(queryByTestId('no-results')).toBeNull();
  });

  it('muestra el OfflineBanner y ejecuta la acción de reintento si no hay conexión', () => {
    mockUseNetInfo.mockReturnValue({ isConnected: false });
    const handleRetry = jest.fn();

    const { getByTestId } = render(
      <AdminListLayout {...defaultProps} handleRetryConnection={handleRetry}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    expect(getByTestId('offline-banner')).toBeTruthy();
    fireEvent.press(getByTestId('retry-button'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('ejecuta los callbacks de SearchFilter (onChangeText y onChangeOrder)', () => {
    const setSearchQueryMock = jest.fn();
    const setCurrentPageMock = jest.fn();
    const setOrderByMock = jest.fn();

    const filter = {
      ...defaultFilter,
      setSearchQuery: setSearchQueryMock,
      setCurrentPage: setCurrentPageMock,
      setOrderBy: setOrderByMock,
    };

    const { getByTestId } = render(
      <AdminListLayout {...defaultProps} filter={filter}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    fireEvent.press(getByTestId('change-text-btn'));
    expect(setSearchQueryMock).toHaveBeenCalledWith('search query');
    expect(setCurrentPageMock).toHaveBeenCalledWith(1);

    fireEvent.press(getByTestId('change-order-btn'));
    expect(setOrderByMock).toHaveBeenCalledWith('asc');
  });

  it('muestra NoResultSearch si filteredData está vacío', () => {
    const filterEmpty = { ...defaultFilter, filteredData: [] };

    const { getByTestId, queryByText } = render(
      <AdminListLayout {...defaultProps} filter={filterEmpty}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    expect(getByTestId('no-results')).toBeTruthy();
    expect(queryByText('Children Content')).toBeNull();
  });

  it('ejecuta el cambio de página en ListPages', () => {
    const setCurrentPageMock = jest.fn();
    const filter = { ...defaultFilter, setCurrentPage: setCurrentPageMock };

    const { getByTestId } = render(
      <AdminListLayout {...defaultProps} filter={filter}>
        <Text>Children Content</Text>
      </AdminListLayout>
    );

    fireEvent.press(getByTestId('change-page-btn'));
    expect(setCurrentPageMock).toHaveBeenCalledWith(2);
  });
});