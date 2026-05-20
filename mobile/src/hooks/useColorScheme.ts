import { useColorScheme as useRNColorScheme } from "react-native";

/**
 * Thin wrapper around React Native's `useColorScheme` that
 * always returns "light" or "dark" (never null) so consumers
 * can rely on a defined value.
 */
export function useColorScheme(): "light" | "dark" {
  return useRNColorScheme() ?? "light";
}
