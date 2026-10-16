import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Breadcrumb } from '@/components/breadcrumb';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(),
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFFFFF',
    pageSeparator: '#EEEEEE',
    pageSubtitle: '#666666',
    breadcrumbSeparator: '#999999',
    header: '#333333',
  }),
}));

describe('Breadcrumb component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ejecuta onParentPress cuando se le pasa la función', () => {
    const onParentPress = jest.fn();
    const { getByTestId } = render(
      <Breadcrumb parent="Padre" current="Actual" onParentPress={onParentPress} />
    );

    fireEvent.press(getByTestId('breadcrumb-parent-btn'));
    expect(onParentPress).toHaveBeenCalledTimes(1);
  });

  it('navega a parentRoute si no hay onParentPress pero sí parentRoute', () => {
    const { getByTestId } = render(
      <Breadcrumb parent="Padre" current="Actual" parentRoute="/(tabs)/custom" />
    );

    fireEvent.press(getByTestId('breadcrumb-parent-btn'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)/custom');
  });

  it('ejecuta router.back() si canGoBack es true y no hay callback ni ruta', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(true);
    const { getByTestId } = render(
      <Breadcrumb parent="Padre" current="Actual" />
    );

    fireEvent.press(getByTestId('breadcrumb-parent-btn'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta router.back() si canGoBack es false', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);
    const { getByTestId } = render(
      <Breadcrumb parent="Padre" current="Actual" />
    );

    fireEvent.press(getByTestId('breadcrumb-parent-btn'));
    expect(router.back).not.toHaveBeenCalled();
  });
});