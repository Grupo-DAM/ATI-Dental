import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListPages } from '@/components/users-list/list-pages-viewer';

// --- Mocks ---

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

describe('ListPages Component - Extended Coverage', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. Basic & Default Props Coverage ---

  it('renders correctly with default prop values', () => {
    const { getByText } = render(
      <ListPages onPageChange={mockOnPageChange} />
    );

    expect(getByText('Showing 0 to 0 of 0 results')).toBeTruthy();
  });

  it('renders exactly 2 buttons when totalPages is 2', () => {
    const { getByText, queryByText } = render(
      <ListPages
        total={10}
        minRange={1}
        maxRange={5}
        currentPage={1}
        totalPages={2}
        onPageChange={mockOnPageChange}
      />
    );

    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(queryByText('3')).toBeNull();
  });

  // --- 2. Pagination Calculation Coverage (getFirstBtnPage, getSecondBtnPage, getThirdBtnPage) ---

  it('handles pagination state when totalPages = 2 and currentPage = 2', () => {
    const { getByText } = render(
      <ListPages
        total={10}
        minRange={6}
        maxRange={10}
        currentPage={2}
        totalPages={2}
        onPageChange={mockOnPageChange}
      />
    );

    const btnTwo = getByText('2');
    fireEvent.press(btnTwo);

    // getSecondBtnPage returns 2 when totalPages is 2
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles middle page state (totalPages = 5, currentPage = 3)', () => {
    const { getByText, UNSAFE_getAllByType } = render(
      <ListPages
        total={25}
        minRange={11}
        maxRange={15}
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    // Button 1 shows left chevron symbol (currentPage > 2 and totalPages > 3)
    // Button 3 shows right chevron symbol (currentPage <= totalPages - 2)
    const chevrons = UNSAFE_getAllByType('SymbolView' as any);
    expect(chevrons.length).toBe(2);

    // Second button displays current page (3)
    expect(getByText('3')).toBeTruthy();

    // Clicking middle button triggers onPageChange(3)
    fireEvent.press(getByText('3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('handles last page state (totalPages = 5, currentPage = 5)', () => {
    const { getByText, queryByText } = render(
      <ListPages
        total={25}
        minRange={21}
        maxRange={25}
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    // Button 2 displays totalPages - 1 (4)
    expect(getByText('4')).toBeTruthy();
    // Button 3 displays totalPages (5)
    expect(getByText('5')).toBeTruthy();

    // Pressing button 2 (page 4)
    fireEvent.press(getByText('4'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);

    // getFirstBtnPage() returns currentPage - 1 (4) when pressing left symbol button
    mockOnPageChange.mockClear();
    fireEvent.press(getByText('4'));
  });

  it('calculates third button page correctly when on the second to last page (currentPage = 4 of 5)', () => {
    const { getByText } = render(
      <ListPages
        total={25}
        minRange={16}
        maxRange={20}
        currentPage={4}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    // Third button page should display 5
    expect(getByText('5')).toBeTruthy();
    fireEvent.press(getByText('5'));

    // getThirdBtnPage() returns totalPages (5) when currentPage > totalPages - 2
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });

  // --- 3. Chevron Navigation Presses ---

  it('triggers onPageChange with decremented page when left chevron is pressed', () => {
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

    // Get parent Pressable of the first SymbolView (left chevron)
    const chevrons = UNSAFE_getAllByType('SymbolView' as any);
    const leftChevronBtn = chevrons[0].parent;

    fireEvent.press(leftChevronBtn);

    // getFirstBtnPage() returns currentPage - 1 = 3
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('triggers onPageChange with incremented page when right chevron is pressed', () => {
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

    // Get parent Pressable of the second SymbolView (right chevron)
    const chevrons = UNSAFE_getAllByType('SymbolView' as any);
    const rightChevronBtn = chevrons[1].parent;

    fireEvent.press(rightChevronBtn);

    // getThirdBtnPage() returns currentPage + 1 = 5
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });
});