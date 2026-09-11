import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useDerivedValue, // 1. Usaremos derivación limpia en vez de useEffect imperativo
    withTiming,
    interpolateColor
} from 'react-native-reanimated';

import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type DropdownSelectorProps = {
    value?: boolean;
    onSwitch: () => void;
};

export function Switch({ value = true, onSwitch }: DropdownSelectorProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const progress = useDerivedValue(() => {
    return withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const animatedBackgroundStyle = useAnimatedStyle(() => {
      const inactiveColor = theme.breadcrumbSeparator || '#ccc';
      const activeColor = theme.main || '#000';

      const backgroundColor = interpolateColor(
        progress.value,
        [0, 1],
        [inactiveColor, activeColor]
      );
      return { backgroundColor };
  });

  const animatedSwitchStyle = useAnimatedStyle(() => {
    const translateX = progress.value * 17;
    return {
        transform: [{ translateX }],
    };
  });

  return (
      <Pressable testID="switch-pressable" style={styles.pressable} onPress={onSwitch}>
        <Animated.View style={[styles.backgroundElement, animatedBackgroundStyle]}>
            <Animated.View style={[styles.switch, animatedSwitchStyle]} />
        </Animated.View>
      </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    pressable: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center'
    },
    backgroundElement: {
        width: 35,
        height: 16,
        borderRadius: 16,
        justifyContent: 'center',
        paddingLeft: 3,
    },
    switch: {
       width: 12,
       height: 12,
       borderRadius: 6,
       backgroundColor: Colors.dark.logo || '#fff'
    }
});
