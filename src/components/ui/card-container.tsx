import React, { useMemo } from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { createCardContainerStyles } from "@/constants/styles/global.styles";

interface CardContainerProps extends ViewProps {
    cardStyle?: StyleProp<ViewStyle>;
    wrapperStyle?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

export function CardContainer({
    children,
    cardStyle,
    wrapperStyle,
    style,
    ...restProps
}: CardContainerProps)  {
    const theme = useTheme();
    const styles = useMemo(() => createCardContainerStyles(theme), [theme]);

    return (
        <View style={[styles.cardWrapper, wrapperStyle, style]}>
            <View style={[styles.card, cardStyle]}>
                {children}
            </View>
        </View>
    );  
}