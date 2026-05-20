import { Text, View } from "react-native";

import { cn } from "@/utils/cn";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Title + subtitle pair used at the top of every auth screen.
 * Keeps spacing and typography consistent between Login & Signup.
 */
export function AuthHeader({ title, subtitle, className }: AuthHeaderProps) {
  return (
    <View className={cn("mb-8", className)}>
      <View className="mb-6 h-12 w-12 items-center justify-center rounded-2xl bg-brand-500">
        <Text className="text-xl font-bold text-white">A</Text>
      </View>
      <Text className="text-3xl font-bold tracking-tight text-ink-light dark:text-ink-dark">
        {title}
      </Text>
      {subtitle ? (
        <Text className="mt-2 text-base text-ink-muted dark:text-ink-muted">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
