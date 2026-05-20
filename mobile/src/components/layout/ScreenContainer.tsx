import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { cn } from "@/utils/cn";

type ScreenContainerProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Defaults to true for form screens. */
  scrollable?: boolean;
  /** Extra classes appended to the inner content wrapper. */
  className?: string;
  /** Disable the keyboard-avoiding behavior (rare). */
  disableKeyboardAvoidance?: boolean;
};

/**
 * The single layout primitive every screen should sit inside.
 * Handles: safe area, status bar styling, keyboard avoidance,
 * and consistent horizontal padding for light/dark themes.
 */
export function ScreenContainer({
  children,
  scrollable = true,
  className,
  disableKeyboardAvoidance = false,
}: ScreenContainerProps) {
  const scheme = useColorScheme();

  const content = (
    <View className={cn("flex-1 px-6 py-4", className)}>{children}</View>
  );

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  ) : (
    content
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-surface dark:bg-surface-dark"
    >
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      {disableKeyboardAvoidance ? (
        body
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          {body}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
