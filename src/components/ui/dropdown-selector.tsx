import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function DropdownSelector({children}: {children: string[]}) {
  const [isOpen, setIsOpen] = useState(false);
  const [option, setOption] = useState(children?.[0]);
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <ThemedView>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <ThemedText style = {styles.text}>{option}</ThemedText>
        <ThemedView type="backgroundElement" style={styles.button}>
          <View style={{ transform: [{ rotate: isOpen ? '-90deg' : '90deg' }] }}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            weight="bold"
            tintColor={theme.text}
          />
          </View>
        </ThemedView>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <ThemedView type="backgroundElement" style={styles.content}>
            {children.map((opt: string) => (
                <Pressable key={opt}
                    style={({ pressed }) => [pressed && styles.pressedHeading]}
                    onPress={() => setOption(opt)}>
                    <ThemedText
                        style = {styles.text}
                        key={opt}
                    >
                        {opt}
                    </ThemedText>
                </Pressable>
            ))}
          </ThemedView>
        </Animated.View>
      )}
    </ThemedView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElement,
    borderRadius: 8,
    paddingLeft: Spacing.two || 6,
    paddingRight: 4,
    height: 28,
  },
  pressedHeading: {
    opacity: 0.7,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  text: {
    fontSize: 12,
    color: theme.textNames,
    fontWeight: 400
  }
});
