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
        {parent ? <Text testID="bc-parent">{parent}</Text> : null}
        {current ? <Text testID="bc-current">{current}</Text> : null}
      </View>
    ),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
    expect(getByTestId('bc-parent')).toBeTruthy();
    expect(getByTestId('bc-current')).toBeTruthy();
    expect(getByText('Mi Título')).toBeTruthy();
    expect(getByText('Mi Subtítulo')).toBeTruthy();
    expect(getByText('Contenido Hijo')).toBeTruthy();
  });

  it('renders title and breadcrumb keys with translation and modals', () => {
    const { getByText } = render(
      <PageTitleLayout
        titleKey="common.title"
        subtitleKey="common.subtitle"
        parentBreadcrumbKey="common.parent"
        currentBreadcrumbKey="common.current"
        modals={<View testID="mock-modal"><Text>Modal Activo</Text></View>}
      >
        <Text>Contenido</Text>
      </PageTitleLayout>
    );

    expect(getByText('common.title')).toBeTruthy();
    expect(getByText('common.subtitle')).toBeTruthy();
    expect(getByText('Modal Activo')).toBeTruthy();
    expect(getByText('Contenido')).toBeTruthy();
  });

  it('renderiza solo con titleKey sin subtitleKey', () => {
    const { getByText, queryByText } = render(
      <PageTitleLayout
        titleKey="common.onlyTitle"
        currentBreadcrumbKey="common.current"
      />
    );

    expect(getByText('common.onlyTitle')).toBeTruthy();
    expect(queryByText('common.subtitle')).toBeNull();
  });

  it('renderiza solo con subtitleKey sin titleKey', () => {
    const { getByText, queryByText } = render(
      <PageTitleLayout
        subtitleKey="common.onlySubtitle"
        currentBreadcrumbKey="common.current"
      />
    );

    expect(getByText('common.onlySubtitle')).toBeTruthy();
    expect(queryByText('common.title')).toBeNull();
  });

  it('renderiza sin titleKey ni subtitleKey (como en Home)', () => {
    const { getByTestId, queryByText } = render(
      <PageTitleLayout currentBreadcrumbKey="tabs.home">
        <View testID="home-content" />
      </PageTitleLayout>
    );

    expect(getByTestId('home-content')).toBeTruthy();
    expect(queryByText('common.title')).toBeNull();
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
