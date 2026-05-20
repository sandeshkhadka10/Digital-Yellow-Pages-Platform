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
import { signupSchema, type SignupFormValues } from "@/schemas/auth.schema";

export function SignupScreen() {
  const { control, handleSubmit, formState } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { submit, isSubmitting, submitError } = useAuthSubmit<SignupFormValues>(
    async (values) => {
      await new Promise((r) => setTimeout(r, 900));
      Alert.alert("Account created", `Welcome, ${values.name}!`, [
        { text: "Continue", onPress: () => router.replace("../login") },
      ]);
    }
  );

  const { request, promptAsync, isLoading: isGoogleLoading } = useGoogleAuth();

  return (
    <ScreenContainer>
      <AuthHeader
        title="Create account"
        subtitle="It only takes a minute to get started."
      />

      <View>
        <FormField
          control={control}
          name="name"
          label="Full name"
          placeholder="Jane Doe"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />

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
          placeholder="At least 8 characters"
          helperText="Use 8 or more characters."
          secure
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="next"
        />

        <FormField
          control={control}
          name="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your password"
          secure
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSubmit(submit)}
        />

        {submitError ? (
          <Text className="mb-3 text-sm text-danger">{submitError}</Text>
        ) : null}

        <Button
          label="Create account"
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
        label="Sign up with Google"
      />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-ink-muted">Already have an account? </Text>
        <Pressable
          onPress={() => router.push("../login")}
          hitSlop={8}
          accessibilityRole="link"
        >
          <Text className="font-semibold text-brand-500">Sign in</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
