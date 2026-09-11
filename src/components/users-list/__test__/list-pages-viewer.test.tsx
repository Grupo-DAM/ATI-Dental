import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListPages } from '@/components/users-list/list-pages-viewer';

// Mock native hooks and modules
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundSecondary: '#f5f5f5',
    backgroundSelected: '#e0e0e0',
    backgroundElement: '#ffffff',
    cardSeparator: '#cccccc',
    main: '#6200ee',
    pageSubtitle: '#666666',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (key === 'admin-users.searchResult') {
        return `Showing ${params?.min} to ${params?.max} of ${params?.total} results`;
      }
      return key;
    },
  }),
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

describe('ListPages Component', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correct results text with translation params', () => {
    const { getByText } = render(
      <ListPages
        total={25}
        minRange={1}
        maxRange={5}
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    expect(getByText('Showing 1 to 5 of 25 results')).toBeTruthy();
  });

  it('renders no page buttons when totalPages is 0', () => {
    const { queryByText } = render(
      <ListPages
        total={0}
        minRange={0}
        maxRange={0}
        currentPage={0}
        totalPages={0}
        onPageChange={mockOnPageChange}
      />
    );

    expect(queryByText('1')).toBeNull();
  });

  it('renders only 1 page button when totalPages is 1', () => {
    const { getByText, queryByText } = render(
      <ListPages
        total={5}
        minRange={1}
        maxRange={5}
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(getByText('1')).toBeTruthy();
    expect(queryByText('2')).toBeNull();
  });

  it('triggers onPageChange when a page button is pressed', () => {
    const { getByText } = render(
      <ListPages
        total={15}
        minRange={1}
        maxRange={5}
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.press(getByText('2'));

    expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('renders chevrons when totalPages > 3 and user navigates deep into pages', () => {
    const { UNSAFE_getAllByType } = render(
      <ListPages
        total={50}
        minRange={16}
        maxRange={20}
        currentPage={4}
        totalPages={10}
        onPageChange={mockOnPageChange}
      />
    );

    // Should render SymbolView icon for navigation pagination
    expect(UNSAFE_getAllByType('SymbolView' as any).length).toBeGreaterThan(0);
  });
});