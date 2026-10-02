import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { PageTitleLayout } from '@/components/page-title-layout';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#F7F6F8',
    backgroundElement: '#FFFFFF',
    border: '#E5E7EB',
    cardSeparator: '#D1D5DB',
    text: '#111827',
    pageTitle: '#1F2937',
    pageSubtitle: '#6B7280',
    fieldLabel: '#374151',
    error: '#EF4444',
    main: '#5B2D8B',
    overMain: '#FFFFFF',
    textSecondary: '#6B7280',
  }),
}));

jest.mock('@/components/app-header', () => {
  const { View } = require('react-native');
  return {
    AppHeader: () => <View testID="mock-app-header" />,
  };
});

jest.mock('@/components/breadcrumb', () => {
  const { View, Text } = require('react-native');
  return {
    Breadcrumb: ({ parent, current }: any) => (
      <View testID="mock-breadcrumb">
        <Text>{parent}</Text>
        <Text>{current}</Text>
      </View>
    ),
  };
});

describe('PageTitleLayout', () => {
  it('renders title, subtitle, breadcrumb, header, and children correctly with direct strings', () => {
    const { getByText, getByTestId } = render(
      <PageTitleLayout
        title="Mi Título"
        subtitle="Mi Subtítulo"
        parentBreadcrumb="Inicio"
        currentBreadcrumb="Módulo"
        testID="custom-layout"
      >
        <Text>Contenido Hijo</Text>
      </PageTitleLayout>
    );

    expect(getByTestId('custom-layout')).toBeTruthy();
    expect(getByTestId('mock-app-header')).toBeTruthy();
    expect(getByText('Inicio')).toBeTruthy();
    expect(getByText('Módulo')).toBeTruthy();
    expect(getByText('Mi Título')).toBeTruthy();
    expect(getByText('Mi Subtítulo')).toBeTruthy();
    expect(getByText('Contenido Hijo')).toBeTruthy();
  });

  it('renders title and breadcrumb keys with translation and modals', () => {
    const { getByText } = render(
      <PageTitleLayout
        titleKey="tabs.home"
        subtitleKey="tabs.explore"
        parentBreadcrumbKey="tabs.agenda"
        currentBreadcrumbKey="tabs.profile"
        modals={<View testID="mock-modal"><Text>Modal Activo</Text></View>}
      >
        <Text>Contenido</Text>
      </PageTitleLayout>
    );

    expect(getByText('Modal Activo')).toBeTruthy();
    expect(getByText('Contenido')).toBeTruthy();
  });

  it('renders loading state when authLoading is true', () => {
    const { getByTestId, queryByText } = render(
      <PageTitleLayout
        title="Mi Título"
        parentBreadcrumb="Inicio"
        currentBreadcrumb="Módulo"
        authLoading={true}
      >
        <Text>Contenido Hijo</Text>
      </PageTitleLayout>
    );

    expect(getByTestId('page-title-layout-loading')).toBeTruthy();
    expect(queryByText('Contenido Hijo')).toBeNull();
  });

  it('renders access denied state when hasPermission is false', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PageTitleLayout
        title="Mi Título"
        parentBreadcrumb="Inicio"
        currentBreadcrumb="Módulo"
        hasPermission={false}
        accessDeniedTitle="Acceso Restringido"
        accessDeniedDesc="No tienes permisos para ver esto."
      >
        <Text>Contenido Hijo</Text>
      </PageTitleLayout>
    );

    expect(getByTestId('page-title-layout-access-denied')).toBeTruthy();
    expect(getByText('Acceso Restringido')).toBeTruthy();
    expect(getByText('No tienes permisos para ver esto.')).toBeTruthy();
    expect(queryByText('Contenido Hijo')).toBeNull();
  });

  it('renders headerRight and supports scrollable=false', () => {
    const { getByText } = render(
      <PageTitleLayout
        title="Mi Título"
        parentBreadcrumb="Inicio"
        currentBreadcrumb="Módulo"
        scrollable={false}
        headerRight={<Text>Acción Derecha</Text>}
      >
        <Text>Contenido no scrollable</Text>
      </PageTitleLayout>
    );

    expect(getByText('Acción Derecha')).toBeTruthy();
    expect(getByText('Contenido no scrollable')).toBeTruthy();
  });
});
