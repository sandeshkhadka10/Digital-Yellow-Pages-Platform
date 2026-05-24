import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { Screen } from '@/components/ui/screen';
import { ApiError, authApi } from '@/lib/api';
import { authEmailSchema } from '@/lib/auth-validation';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleRequestOtp() {
        const validation = authEmailSchema.safeParse({ email });
        if (!validation.success) {
            setError(validation.error.issues[0]?.message ?? 'Please enter a valid email address.');
            return;
        }

        const trimmed = validation.data.email;
        setError('');
        setIsLoading(true);
        try {
            await authApi.loginRequestOtp(trimmed);
            router.push({ pathname: '/(auth)/otp-verify', params: { email: trimmed, mode: 'login' } });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.status === 404 ? 'No account found with this email. Please sign up.' : err.message);
            } else {
                setError('Unable to connect. Please check your internet connection.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Screen>
            <View className="flex-1 justify-center">
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-gray-900">Welcome back to DYP</Text>
                    <Text className="mt-2 text-base text-gray-500">Enter your email and we'll send you a one-time code.</Text>
                </View>
                <View className="gap-5">
                    <AppInput
                        label="Email address"
                        placeholder="you@example.com"
                        value={email}
                        onChangeText={(text) => { setEmail(text); setError(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleRequestOtp}
                        error={error}
                    />
                    <AppButton title="Send OTP" onPress={handleRequestOtp} isLoading={isLoading} fullWidth size="lg" />
                </View>
                <View className="mt-8 flex-row items-center justify-center gap-1">
                    <Text className="text-base text-gray-500">Don't have an account?</Text>
                    <AppButton title="Sign up" variant="ghost" size="sm" onPress={() => router.replace('/(auth)/sign-up')} />
                </View>
            </View>
        </Screen>
    );
}
