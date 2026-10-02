import React from 'react';
import { render } from '@testing-library/react-native';
import { PageTitleLayout } from '@/components/page-title-layout';
import { Text, View } from 'react-native';

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@/components/breadcrumb', () => ({
  Breadcrumb: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PageTitleLayout', () => {
  it('renderiza con titleKey, subtitleKey y parentBreadcrumbKey', () => {
    const { getByText } = render(
      <PageTitleLayout
        titleKey="common.title"
        subtitleKey="common.subtitle"
        parentBreadcrumbKey="common.parent"
        currentBreadcrumbKey="common.current"
      >
        <Text>Contenido</Text>
      </PageTitleLayout>
    );

    expect(getByText('common.title')).toBeTruthy();
    expect(getByText('common.subtitle')).toBeTruthy();
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
    const { queryByText } = render(
      <PageTitleLayout currentBreadcrumbKey="tabs.home">
        <View testID="home-content" />
      </PageTitleLayout>
    );

    expect(queryByText('tabs.home')).toBeNull();
  });
});
