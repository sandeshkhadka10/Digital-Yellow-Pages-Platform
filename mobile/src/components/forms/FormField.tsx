import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Input, type InputProps } from "@/components/ui/Input";
import { cn } from "@/utils/cn";

type FormFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  helperText?: string;
  /** Renders a built-in eye toggle and starts hidden. */
  secure?: boolean;
  containerClassName?: string;
} & Omit<InputProps, "value" | "onChangeText" | "onBlur" | "secureTextEntry">;

/**
 * Connects React Hook Form's `Controller` to our themed `Input`.
 *
 * Why a wrapper? It keeps screens declarative — each field is a single
 * component instead of `<Controller>` + `<Input>` + error markup spread
 * across the screen.
 */
export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  helperText,
  secure = false,
  containerClassName,
  ...inputProps
}: FormFieldProps<TFieldValues>) {
  const [hidden, setHidden] = useState(secure);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
        const hasError = Boolean(error);
        const message = error?.message ?? helperText;

        return (
          <View className={cn("mb-4", containerClassName)}>
            <Text className="mb-2 text-sm font-medium text-ink-light dark:text-ink-dark">
              {label}
            </Text>

            <Input
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              hasError={hasError}
              secureTextEntry={secure && hidden}
              rightSlot={
                secure ? (
                  <Pressable
                    onPress={() => setHidden((h) => !h)}
                    accessibilityRole="button"
                    accessibilityLabel={hidden ? "Show password" : "Hide password"}
                    hitSlop={8}
                  >
                    <Text className="text-sm font-medium text-brand-500">
                      {hidden ? "Show" : "Hide"}
                    </Text>
                  </Pressable>
                ) : undefined
              }
              {...inputProps}
            />

            {message ? (
              <Text
                className={cn(
                  "mt-1.5 text-xs",
                  hasError
                    ? "text-danger"
                    : "text-ink-muted dark:text-ink-muted"
                )}
              >
                {message}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}
