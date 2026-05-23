import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import '../global.css';
import { AuthProvider, useAuth } from '@/context/auth-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)' as never);
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#f59e0b" style={{ flex: 1 }} />;
  }

  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
