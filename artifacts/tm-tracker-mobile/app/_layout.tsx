import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { setBaseUrl } from '@workspace/api-client-react';

// Resolve the API server URL:
//  1. EXPO_PUBLIC_API_URL takes highest priority (production / staging override).
//  2. In Expo Go / dev-client on Android/iOS, Expo injects the LAN host via
//     Constants.expoConfig.hostUri (e.g. "192.168.100.162:8081").
//     We strip the Metro port and append the Express port (3000).
//  3. On web or as a last resort, fall back to localhost:3000.
function resolveApiUrl(): string {
  // Explicit override always wins
  const explicit = process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_DOMAIN;
  if (explicit) {
    if (explicit.startsWith("http://") || explicit.startsWith("https://")) return explicit;
    return /^localhost|^127\.|^192\.|^10\./.test(explicit) ? `http://${explicit}` : `https://${explicit}`;
  }

  if (__DEV__) {
    // On native (Android / iOS) grab the LAN IP Expo injects at runtime
    if (Platform.OS !== 'web') {
      const hostUri: string | undefined =
        (Constants.expoConfig as any)?.hostUri ??
        (Constants as any)?.manifest?.debuggerHost ??
        (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;

      if (hostUri) {
        // hostUri looks like "192.168.100.162:8081" — replace Metro port with API port (8080)
        const lanIp = hostUri.split(':')[0];
        console.log(`[API] Using LAN IP: http://${lanIp}:8080`);
        return `http://${lanIp}:8080`;
      }
    }
    // Web dev — localhost:8080 is correct
    console.warn('[API] Falling back to http://localhost:8080 — set EXPO_PUBLIC_API_URL for production.');
    return 'http://localhost:8080';
  }

  return 'http://localhost:8080';
}

const apiUrl = resolveApiUrl();
setBaseUrl(apiUrl);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="trademark/[id]"
        options={{
          presentation: 'card',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
