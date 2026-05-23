import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { Screen } from '@/components/ui/screen';
import { ApiError, authApi } from '@/lib/api';

export default function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleRequestOtp() {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) { setError('Please enter your email address.'); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) { setError('Please enter a valid email address.'); return; }
        setError('');
        setIsLoading(true);
        try {
            await authApi.signUpRequestOtp(trimmed);
            router.push({ pathname: '/(auth)/otp-verify', params: { email: trimmed, mode: 'signup' } });
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.status === 409 ? 'An account with this email already exists. Please log in.' : err.message);
            } else {
                setError('Unable to connect. Please check your internet connection.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Screen>
            <View className="mb-10 mt-6">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-amber-400">
                    <Text className="text-2xl font-bold text-gray-900">D</Text>
                </View>
                <Text className="text-3xl font-bold text-gray-900">Create account</Text>
                <Text className="mt-2 text-base text-gray-500">Enter your email to get started. We'll send you a code.</Text>
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
                <Text className="text-base text-gray-500">Already have an account?</Text>
                <AppButton title="Log in" variant="ghost" size="sm" onPress={() => router.replace('/(auth)/login')} />
            </View>
        </Screen>
    );
}
