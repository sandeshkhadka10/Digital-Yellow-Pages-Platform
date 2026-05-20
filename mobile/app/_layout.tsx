import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Ensures the in-app browser closes and returns to the app after Google
// redirects back on web.
WebBrowser.maybeCompleteAuthSession();

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack
          initialRouteName="login"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
