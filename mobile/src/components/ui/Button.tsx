import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
};

const containerVariants: Record<Variant, string> = {
  primary:
    "bg-brand-500 active:bg-brand-600 disabled:bg-brand-500/50 dark:disabled:bg-brand-500/40",
  secondary:
    "bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700 disabled:opacity-60",
  ghost:
    "bg-transparent active:bg-slate-100 dark:active:bg-slate-800 disabled:opacity-50",
};

const textVariants: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-ink-light dark:text-ink-dark",
  ghost: "text-brand-500 dark:text-brand-400",
};

const sizeVariants: Record<Size, string> = {
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

/**
 * Single button primitive used across the app.
 * Supports variants (primary/secondary/ghost), loading state,
 * and disables itself automatically when `loading` is true.
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  fullWidth = true,
  className,
  textClassName,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        "flex-row items-center justify-center rounded-xl",
        sizeVariants[size],
        containerVariants[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#3366ff"}
        />
      ) : (
        <Text
          className={cn(
            "text-base font-semibold",
            textVariants[variant],
            textClassName
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
