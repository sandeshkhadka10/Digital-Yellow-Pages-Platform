import { forwardRef, useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { cn } from "@/utils/cn";

export type InputProps = TextInputProps & {
  /** Visual error state. Usually driven by a form library. */
  hasError?: boolean;
  /** Optional element rendered on the right (e.g., a show/hide toggle). */
  rightSlot?: React.ReactNode;
  containerClassName?: string;
};

type FocusHandler = NonNullable<TextInputProps["onFocus"]>;
type BlurHandler = NonNullable<TextInputProps["onBlur"]>;

/**
 * Theme-aware, controlled-friendly text input.
 *
 * - Uses `forwardRef` so libraries like React Hook Form can focus it.
 * - Tracks focus state to render a brand-colored ring without relying
 *   on platform-default focus styles (which differ across iOS/Android/web).
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    hasError,
    rightSlot,
    containerClassName,
    className,
    onFocus,
    onBlur,
    placeholderTextColor,
    ...rest
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: FocusHandler = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: BlurHandler = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View
      className={cn(
        "flex-row items-center rounded-xl border bg-white px-4 dark:bg-slate-900",
        hasError
          ? "border-danger"
          : isFocused
            ? "border-brand-500"
            : "border-slate-200 dark:border-slate-700",
        containerClassName
      )}
    >
      <TextInput
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={placeholderTextColor ?? "#94a3b8"}
        className={cn(
          "flex-1 py-4 text-base text-ink-light dark:text-ink-dark",
          className
        )}
        {...rest}
      />
      {rightSlot ? <View className="ml-2">{rightSlot}</View> : null}
    </View>
  );
});
