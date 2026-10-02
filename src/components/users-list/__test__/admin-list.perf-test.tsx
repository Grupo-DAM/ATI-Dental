import React from 'react';
import { measureRenders } from 'reassure';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';
import { View, Text } from 'react-native';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: true }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    text: '#111',
    pageTitle: '#111',
    pageSubtitle: '#666',
    backgroundElement: '#FFF',
    accentBackground: '#F3E8FF',
    background: '#FAFAFA',
    logo: '#5B2D8B',
    fieldLabel: '#333',
    reportValueText: '#111',
  }),
}));

// Genera N tarjetas de usuario simuladas como children
function generateUserCards(count: number) {
  return Array.from({ length: count }, (_, i) => (
    <View key={i} testID={`user-card-${i}`}>
      <Text>Usuario {i + 1}</Text>
      <Text>user{i}@test.com</Text>
    </View>
  ));
}

const baseMockFilter = {
  searchQuery: '',
  setSearchQuery: jest.fn(),
  setCurrentPage: jest.fn(),
  setOrderBy: jest.fn(),
  selectedRoles: [],
  selectedStatus: [],
  handleToggleFilter: jest.fn(),
  filteredData: Array.from({ length: 50 }, (_, i) => ({ id: `${i}`, name: `User ${i}` })),
  maxRange: 10,
  minRange: 1,
  currentPage: 1,
  totalPages: 5,
};

jest.setTimeout(120_000);

describe('AdminListLayout - Rendimiento con listas pesadas', () => {
  it('Renderiza layout con 50 usuarios sin regresión', async () => {
    const scenario = async () => {
      /* No extra interactions — pure mount measurement */
    };

    await measureRenders(
      <AdminListLayout
        titleKey="admin-users.title"
        subtitleKey="admin-users.subtitle"
        parentBreadcrumbKey="admin-users.parent"
        currentBreadcrumbKey="admin-users.current"
        accessDeniedTitleKey="admin-users.denied"
        accessDeniedDescKey="admin-users.deniedDesc"
        authLoading={false}
        hasPermission={true}
        isRetrying={false}
        handleRetryConnection={jest.fn()}
        filter={baseMockFilter}
        testID="admin-list-perf"
      >
        {generateUserCards(50)}
      </AdminListLayout>,
      { runs: 10, scenario },
    );
  });

  it('Renderiza layout con 100 usuarios sin regresión', async () => {
    const heavyFilter = {
      ...baseMockFilter,
      filteredData: Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, name: `User ${i}` })),
    };

    await measureRenders(
      <AdminListLayout
        titleKey="admin-users.title"
        subtitleKey="admin-users.subtitle"
        parentBreadcrumbKey="admin-users.parent"
        currentBreadcrumbKey="admin-users.current"
        accessDeniedTitleKey="admin-users.denied"
        accessDeniedDescKey="admin-users.deniedDesc"
        authLoading={false}
        hasPermission={true}
        isRetrying={false}
        handleRetryConnection={jest.fn()}
        filter={heavyFilter}
        testID="admin-list-perf-heavy"
      >
        {generateUserCards(100)}
      </AdminListLayout>,
      { runs: 10 },
    );
  });
});
