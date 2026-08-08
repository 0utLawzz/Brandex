import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface NavItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
  description: string;
  accent?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Search TM',
    icon: 'search',
    route: '/(tabs)/search-tm',
    description: 'Find any trademark instantly',
  },
  {
    label: 'Dashboard',
    icon: 'home',
    route: '/(tabs)/',
    description: 'Overview stats & analytics',
    accent: true,
  },
  {
    label: 'New TM',
    icon: 'plus-circle',
    route: '/(tabs)/new',
    description: 'Register a new trademark',
  },
  {
    label: 'Database',
    icon: 'database',
    route: '/(tabs)/registry',
    description: 'Browse all trademark records',
  },
  {
    label: 'Assignments',
    icon: 'users',
    route: '/(tabs)/assignments',
    description: 'View & manage assignments',
  },
];

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(NAV_ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(cardsAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.stagger(
        80,
        cardAnims.map((a) =>
          Animated.spring(a, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true })
        )
      ),
    ]).start();
  }, []);

  const topPad = Platform.OS === 'web' ? 20 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom;

  const handleNav = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.replace(route as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header block */}
      <Animated.View
        style={[
          styles.heroBlock,
          {
            paddingTop: topPad + 32,
            opacity: logoAnim,
            transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
      >
        {/* Logo mark */}
        <View style={[styles.logoMark, { backgroundColor: colors.primary, borderColor: colors.foreground }]}>
          <Text style={[styles.logoMarkText, { color: colors.primaryForeground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            TM
          </Text>
        </View>

        <Text style={[styles.appTitle, { color: colors.foreground, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          BRANDEX LAW
        </Text>
        <Text style={[styles.appTitleAccent, { color: colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          ASSOCIATE
        </Text>

        <Animated.View
          style={{
            opacity: taglineAnim,
            transform: [{ translateY: taglineAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Trademark Registry · Powered by Neon
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Divider */}
      <Animated.View style={[styles.divider, { backgroundColor: colors.border, opacity: cardsAnim }]} />

      {/* Nav grid */}
      <View style={[styles.navGrid, { paddingBottom: bottomPad + 24 }]}>
        {NAV_ITEMS.map((item, i) => (
          <Animated.View
            key={item.label}
            style={{
              opacity: cardAnims[i],
              transform: [
                {
                  translateY: cardAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
              // Full row for accent item; half-width for others
              width: item.accent ? '100%' : '48%',
            }}
          >
            <TouchableOpacity
              style={[
                styles.navCard,
                {
                  backgroundColor: item.accent ? colors.primary : colors.card,
                  borderColor: colors.border,
                  shadowColor: colors.foreground,
                },
              ]}
              onPress={() => handleNav(item.route)}
              activeOpacity={0.8}
            >
              <Feather
                name={item.icon}
                size={item.accent ? 26 : 22}
                color={item.accent ? colors.primaryForeground : colors.primary}
              />
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: item.accent ? colors.primaryForeground : colors.foreground,
                    fontFamily: 'SpaceGrotesk_700Bold',
                    fontSize: item.accent ? 16 : 14,
                  },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.navDesc,
                  {
                    color: item.accent ? colors.primaryForeground : colors.mutedForeground,
                    fontFamily: 'SpaceGrotesk_400Regular',
                    opacity: 0.85,
                  },
                ]}
                numberOfLines={1}
              >
                {item.description}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Version badge */}
      <Animated.View style={[styles.versionRow, { opacity: cardsAnim }]}>
        <Text style={[styles.version, { color: colors.mutedForeground, fontFamily: 'SpaceGrotesk_400Regular' }]}>
          v1.0 · Brandex Law Associate
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBlock: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'flex-start',
  },
  logoMark: {
    width: 56,
    height: 56,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  logoMarkText: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  appTitle: {
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 36,
  },
  appTitleAccent: {
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 40,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 14,
  },
  divider: {
    height: 2,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  navGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  navCard: {
    borderWidth: 2,
    padding: 16,
    shadowColor: '#0D0D0D',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    gap: 6,
  },
  navLabel: {
    letterSpacing: 0.2,
    marginTop: 2,
  },
  navDesc: {
    fontSize: 11,
  },
  versionRow: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    alignItems: 'center',
  },
  version: {
    fontSize: 11,
  },
});
