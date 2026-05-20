import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { Alert, Pressable, Text, View } from "react-native";

import {
  AuthHeader,
  Button,
  FormField,
  GoogleSignInButton,
  ScreenContainer,
} from "@/components";
import { useAuthSubmit } from "@/hooks/useAuthSubmit";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";

export function LoginScreen() {
  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const { submit, isSubmitting, submitError } = useAuthSubmit<LoginFormValues>(
    async (values) => {
      // Simulate an API request. Replace with your real auth call.
      await new Promise((r) => setTimeout(r, 900));
      Alert.alert("Welcome back!", `Signed in as ${values.email}`);
    }
  );

  const { request, promptAsync, isLoading: isGoogleLoading } = useGoogleAuth();

  return (
    <ScreenContainer>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to continue to your account."
      />

      <View>
        <FormField
          control={control}
          name="email"
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <FormField
          control={control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          secure
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit(submit)}
        />

        {submitError ? (
          <Text className="mb-3 text-sm text-danger">{submitError}</Text>
        ) : null}

        <Button
          label="Sign in"
          size="lg"
          loading={isSubmitting}
          disabled={!formState.isValid && formState.isSubmitted}
          onPress={handleSubmit(submit)}
        />
      </View>

      {/* Divider */}
      <View className="my-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <Text className="text-sm text-ink-muted">or</Text>
        <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </View>

      <GoogleSignInButton
        onPress={() => promptAsync()}
        loading={isGoogleLoading}
        disabled={!request}
      />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-ink-muted">Don&apos;t have an account? </Text>
        <Pressable
          onPress={() => router.push("../signup")}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text className="font-semibold text-brand-500">Sign up</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
