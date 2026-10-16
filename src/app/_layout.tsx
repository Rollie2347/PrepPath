import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSession } from '@/state/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <AnimatedSplashOverlay />
        <RootStack />
      </SessionProvider>
    </ThemeProvider>
  );
}

function RootStack() {
  const { ready, profile } = useSession();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  const onboarded = !!profile?.onboarded;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[nodeId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="chest/[nodeId]" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
    </Stack>
  );
}
