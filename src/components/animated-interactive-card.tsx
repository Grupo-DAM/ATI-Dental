import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AnimatedInteractiveCard() {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Animated values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Mount entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Looping pulse animation for status indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, translateYAnim, pulseAnim]);

  // Press feedback (scale down slightly)
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  // Toggle details height/opacity
  const handlePress = () => {
    const nextValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.timing(expandAnim, {
      toValue: nextValue,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // height requires non-native driver
    }).start();
  };

  // Interpolations
  const detailsHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150], // Approximate height for details
  });

  const detailsOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const arrowRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const shadowOpacity = scaleAnim.interpolate({
    inputRange: [0.96, 1],
    outputRange: [0.05, 0.15],
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.pressableCard,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: isExpanded ? '#3C9FFE' : theme.backgroundSelected,
            shadowOpacity: Platform.OS === 'ios' ? shadowOpacity : undefined,
          },
        ]}
      >
        {/* Main card info */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Animated.View
              style={[
                styles.pulseIndicator,
                {
                  opacity: pulseAnim,
                },
              ]}
            />
            <ThemedText type="code" style={styles.badgeText}>
              UPCOMING APPOINTMENT
            </ThemedText>
          </View>
          <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={theme.textSecondary}
            />
          </Animated.View>
        </View>

        <View style={styles.cardBody}>
          <ThemedText type="smallBold" style={styles.treatmentTitle}>
            Dental Cleaning & Checkup
          </ThemedText>
          <View style={styles.infoRow}>
            <SymbolView
              name={{ ios: 'person.fill', android: 'person', web: 'person' }}
              size={14}
              tintColor="#3C9FFE"
            />
            <ThemedText type="small" style={styles.infoText}>
              Dr. Sofia Rodriguez
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
              size={14}
              tintColor="#3C9FFE"
            />
            <ThemedText type="small" style={styles.infoText}>
              Today at 3:30 PM (45 mins)
            </ThemedText>
          </View>
        </View>

        {/* Expandable details */}
        <Animated.View
          style={[
            styles.detailsContainer,
            {
              height: detailsHeight,
              opacity: detailsOpacity,
            },
          ]}
        >
          <View style={styles.divider} />
          <View style={styles.detailsContent}>
            <View style={styles.detailItem}>
              <ThemedText type="code" style={styles.detailLabel}>
                CLINIC LOCATION
              </ThemedText>
              <ThemedText type="small" style={styles.detailValue}>
                ATI Dental - Downtown Suite 302
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <ThemedText type="code" style={styles.detailLabel}>
                PREPARATION HINTS
              </ThemedText>
              <ThemedText type="small" style={styles.detailValue}>
                Please arrive 10 minutes early and bring your insurance ID.
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => alert('Checked-In successfully!')}
            >
              <ThemedText type="smallBold" style={styles.actionButtonText}>
                Confirm Check-In
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    marginVertical: Spacing.two,
  },
  pressableCard: {
    borderRadius: Spacing.four,
    borderWidth: 1.5,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(60, 159, 254, 0.1)',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3C9FFE',
  },
  badgeText: {
    color: '#0274DF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  treatmentTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: Spacing.two,
  },
  cardBody: {
    gap: Spacing.one,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.half,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.85,
  },
  detailsContainer: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: Spacing.three,
  },
  detailsContent: {
    gap: Spacing.three,
  },
  detailItem: {
    gap: Spacing.half,
  },
  detailLabel: {
    fontSize: 10,
    color: '#60646C',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
  },
  actionButton: {
    backgroundColor: '#0274DF',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  actionButtonPressed: {
    opacity: 0.85,
    backgroundColor: '#015cb2',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
