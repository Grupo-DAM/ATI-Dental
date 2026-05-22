import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, Animated, View, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { width } = Dimensions.get('window');

export function NetworkBanner() {
  const { isConnected } = useNetworkStatus();
  const [bannerType, setBannerType] = useState<'hidden' | 'offline' | 'restored'>('hidden');
  const slideAnim = useRef(new Animated.Value(-150)).current; // Start hidden above the screen
  const opacityAnim = useRef(new Animated.Value(0)).current; // Fade animation
  const prevConnectedRef = useRef<boolean | null>(null);

  useEffect(() => {
    // If the hook returns null (determining initial state), do nothing yet
    if (isConnected === null) return;

    const prevConnected = prevConnectedRef.current;
    prevConnectedRef.current = isConnected;

    if (isConnected === false) {
      // 1. We lost connection
      setBannerType('offline');
      
      // Animate entry (slide down and fade in)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Platform.OS === 'ios' ? 50 : 25,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isConnected === true) {
      // 2. We are online
      if (prevConnected === false) {
        // We transitioned from offline to online (connection restored)
        setBannerType('restored');

        // Stay on screen, just animate the transition if already visible
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: Platform.OS === 'ios' ? 50 : 25,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        // Wait 3 seconds, then slide out
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -150,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setBannerType('hidden');
          });
        }, 3000);

        return () => clearTimeout(timer);
      } else {
        // Initial mount and we are online: do nothing, keep hidden
        setBannerType('hidden');
      }
    }
  }, [isConnected]);

  if (bannerType === 'hidden') return null;

  const isOffline = bannerType === 'offline';

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.glassBanner,
          isOffline ? styles.offlineBorder : styles.restoredBorder,
        ]}
      >
        <View
          style={[
            styles.iconWrapper,
            isOffline ? styles.offlineIconBg : styles.restoredIconBg,
          ]}
        >
          <Ionicons
            name={isOffline ? 'cloud-offline' : 'checkmark-circle'}
            size={20}
            color="#ffffff"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.titleText}>
            {isOffline ? 'Sin conexión a internet' : 'Conexión restablecida'}
          </Text>
          <Text style={styles.subtitleText}>
            {isOffline
              ? 'La app ahora funciona en modo offline limitado.'
              : 'Se ha vuelto a sincronizar con los servidores.'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
    width: width - 40,
  },
  glassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.85)', // Premium dark slate background
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    width: '100%',
  },
  offlineBorder: {
    borderColor: 'rgba(239, 68, 68, 0.6)', // Bright translucent red
  },
  restoredBorder: {
    borderColor: 'rgba(34, 197, 94, 0.6)', // Bright translucent green
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  offlineIconBg: {
    backgroundColor: '#ef4444',
  },
  restoredIconBg: {
    backgroundColor: '#22c55e',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#cbd5e1', // Light slate
    marginTop: 2,
    letterSpacing: 0.1,
  },
});
