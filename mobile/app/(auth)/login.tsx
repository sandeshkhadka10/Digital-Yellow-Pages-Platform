import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ApiError, authApi } from '@/lib/api';
import { authEmailSchema } from '@/lib/auth-validation';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(tabs)');
    };

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
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <Box className="flex-1 px-6 py-8">
                    <Box className="flex-1">
                        <Box className="mb-6">
                            <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                                <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                            </Pressable>
                        </Box>
                        <Box className="flex-1 justify-center">
                            <Box className="mb-8">
                                <Text className="text-3xl font-bold text-gray-900">Welcome back to DYP</Text>
                                <Text className="mt-2 text-base text-gray-500">Enter your email and we'll send you a one-time code.</Text>
                            </Box>
                            <Box className="gap-5">
                                <Box>
                                    <Text className="mb-1.5 text-sm font-medium text-gray-700">Email address</Text>
                                    <Input variant="outline" isInvalid={!!error} className="rounded-xl border-gray-300 bg-white data-[invalid=true]:border-red-400 data-[invalid=true]:bg-red-50">
                                        <InputField
                                            placeholder="you@example.com"
                                            value={email}
                                            onChangeText={(text) => { setEmail(text); setError(''); }}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            autoFocus
                                            returnKeyType="done"
                                            onSubmitEditing={handleRequestOtp}
                                            placeholderTextColor="#9ca3af"
                                            className="text-sm text-gray-900"
                                        />
                                    </Input>
                                    {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
                                </Box>
                                <Button onPress={handleRequestOtp} isDisabled={isLoading} className="w-full rounded-xl bg-amber-400 data-[active=true]:bg-amber-500 data-[disabled=true]:opacity-50" size="lg">
                                    {isLoading && <ButtonSpinner color="#1f2937" />}
                                    <ButtonText className="font-semibold text-base text-gray-900">Send OTP</ButtonText>
                                </Button>
                            </Box>
                            <Box className="mt-8 flex-row items-center justify-center gap-1">
                                <Text className="text-base text-gray-500">Don't have an account?</Text>
                                <Button variant="link" size="sm" onPress={() => router.replace('/(auth)/sign-up')}><ButtonText className="font-semibold text-sm text-amber-500">Sign up</ButtonText></Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
