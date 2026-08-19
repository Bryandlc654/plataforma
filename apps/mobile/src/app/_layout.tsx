import { useEffect } from 'react';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/auth-store';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useThemeStore } from '../stores/theme-store';

export default function RootLayout() {
  const { isAuthenticated, accessToken, hasHydrated } = useAuthStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { notification } = usePushNotifications(isAuthenticated);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  useEffect(() => {
    if (notification && navigationState?.key) {
      // If a notification arrives/is tapped and contains a url, navigate to it
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url as any);
      }
    }
  }, [notification, navigationState?.key]);

  useEffect(() => {
    // Wait until Expo Router has mounted its Root Navigation and storage is hydrated
    if (!navigationState?.key || !hasHydrated) return;

    // If the auth state is known (or hydrated from storage)
    const inAuthGroup = segments[0] === '(auth)';
    
    // Defer the routing to the next tick to ensure the Root Layout is completely ready
    const timer = setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated and not already in auth group
        router.replace('/(auth)/login');
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to app if authenticated and inside auth group
        router.replace('/(tabs)/sites');
      }
    }, 1);

    return () => clearTimeout(timer);
  }, [isAuthenticated, accessToken, segments, navigationState?.key, hasHydrated]);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#09090B' : '#FAFAFA' }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#FAFAFA' : '#000000'} />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}
