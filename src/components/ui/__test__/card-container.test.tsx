import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { CardContainer } from '@/components/ui/card-container';
import { useTheme } from '@/hooks/use-theme';
import { createCardContainerStyles } from '@/constants/styles/global.styles';

jest.mock('@/hooks/use-theme');
jest.mock('@/constants/styles/global.styles');

describe('CardContainer', () => {
  const mockTheme = { colors: { primary: '#000' } };
  const mockStyles = {
    cardWrapper: { padding: 16, backgroundColor: '#fff' },
    card: { borderRadius: 8, elevation: 2 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (createCardContainerStyles as jest.Mock).mockReturnValue(mockStyles);
  });

  it('debe renderizar los elementos hijos (children) correctamente', () => {
    const { getByText } = render(
      React.createElement(
        CardContainer,
        null,
        React.createElement(Text, null, 'Contenido de prueba')
      )
    );

    expect(getByText('Contenido de prueba')).toBeTruthy();
  });

  it('debe invocar useTheme y createCardContainerStyles con el tema actual', () => {
    render(React.createElement(CardContainer));

    expect(useTheme).toHaveBeenCalledTimes(1);
    expect(createCardContainerStyles).toHaveBeenCalledWith(mockTheme);
  });

  it('debe aplicar los estilos por defecto del wrapper y del card', () => {
    const { UNSAFE_getAllByType } = render(React.createElement(CardContainer));
    const views = UNSAFE_getAllByType(View);

    expect(views[0].props.style).toEqual([
      mockStyles.cardWrapper,
      undefined,
      undefined,
    ]);
    expect(views[1].props.style).toEqual([
      mockStyles.card,
      undefined,
    ]);
  });

  it('debe combinar correctamente los estilos personalizados', () => {
    const customWrapperStyle = { margin: 10 };
    const customStyle = { opacity: 0.8 };
    const customCardStyle = { backgroundColor: 'red' };

    const { UNSAFE_getAllByType } = render(
      React.createElement(CardContainer, {
        wrapperStyle: customWrapperStyle,
        style: customStyle,
        cardStyle: customCardStyle,
      })
    );

    const views = UNSAFE_getAllByType(View);

    expect(views[0].props.style).toEqual([
      mockStyles.cardWrapper,
      customWrapperStyle,
      customStyle,
    ]);
    expect(views[1].props.style).toEqual([
      mockStyles.card,
      customCardStyle,
    ]);
  });

  it('debe pasar propiedades adicionales (restProps) al View exterior', () => {
    const { UNSAFE_getByProps } = render(
      React.createElement(CardContainer, {
        testID: 'card-container-wrapper',
        accessibilityLabel: 'Tarjeta',
      })
    );

    const wrapperView = UNSAFE_getByProps({ testID: 'card-container-wrapper' });
    expect(wrapperView.props.accessibilityLabel).toBe('Tarjeta');
  });
});
