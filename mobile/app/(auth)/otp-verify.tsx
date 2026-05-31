import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, NativeSyntheticEvent, Platform, StyleSheet, TextInput, TextInputKeyPressEventData } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { ApiError, authApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const OTP_EXPIRY_SECONDS = 5 * 60;

export default function OtpVerifyScreen() {
    const { email, mode } = useLocalSearchParams<{ email: string; mode: 'signup' | 'login' }>();
    const { setTokensAndUser } = useAuth();

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // OTP input state
    const OTP_LENGTH = 6;
    const otpInputRefs = useRef<(TextInput | null)[]>([]);
    const [focusedCell, setFocusedCell] = useState<number | null>(0);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(tabs)');
    };

    const startTimer = useCallback(() => {
        setSecondsLeft(OTP_EXPIRY_SECONDS);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setSecondsLeft(s => { if (s <= 1) { clearInterval(timerRef.current!); return 0; } return s - 1; });
        }, 1000);
    }, []);

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [startTimer]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleVerify = useCallback(async (code: string) => {
        if (code.length < 6) return;
        setError('');
        setIsVerifying(true);
        try {
            const result = mode === 'signup'
                ? await authApi.signUpVerifyOtp(code)
                : await authApi.loginVerifyOtp(code);
            await setTokensAndUser(result.access, result.refresh);
            router.replace('/(tabs)');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.status === 403 ? 'Too many incorrect attempts. Please request a new OTP.' : err.status === 400 ? 'Incorrect OTP. Please try again.' : err.message);
            } else {
                setError('Unable to connect. Please check your internet connection.');
            }
            setOtp('');
        } finally {
            setIsVerifying(false);
        }
    }, [mode, setTokensAndUser]);

    useEffect(() => { if (otp.length === 6) handleVerify(otp); }, [otp, handleVerify]);

    const digits = otp.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

    const handleCellChange = useCallback((text: string, index: number) => {
        const digit = text.replace(/\D/g, '').slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        const newValue = newDigits.join('').replace(/ /g, '');
        setOtp(newValue);
        setError('');
        if (digit && index < OTP_LENGTH - 1) otpInputRefs.current[index + 1]?.focus();
    }, [digits]);

    const handleCellKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            const newDigits = [...digits];
            newDigits[index - 1] = '';
            setOtp(newDigits.join('').replace(/ /g, ''));
            otpInputRefs.current[index - 1]?.focus();
        }
    }, [digits]);

    useEffect(() => {
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }, []);

    const handleResend = async () => {
        if (!email) return;
        setError('');
        setOtp('');
        setIsResending(true);
        try {
            if (mode === 'signup') await authApi.signUpRequestOtp(email);
            else await authApi.loginRequestOtp(email);
            startTimer();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Unable to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const maskedEmail = email
        ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)
        : '';

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <Box className="flex-1 px-6 py-8">
                    <Box className="mb-6">
                        <Pressable onPress={handleBack} className="h-10 w-10 self-start items-center justify-center rounded-xl bg-gray-100">
                            <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                        </Pressable>
                    </Box>
                    <Box className="flex-1 justify-center">
                        <Box className="mb-10">
                            <Text className="text-3xl font-bold text-gray-900">Check your email</Text>
                            <Text className="mt-2 text-base text-gray-500">
                                We sent a 6-digit code to <Text className="font-semibold text-gray-700">{maskedEmail}</Text>
                            </Text>
                        </Box>
                        <Box className="mb-6">
                            <Box className="flex-row justify-between gap-2">
                                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                                    <TextInput
                                        key={i}
                                        ref={(el) => { otpInputRefs.current[i] = el; }}
                                        value={digits[i] === ' ' ? '' : digits[i]}
                                        onChangeText={(text) => handleCellChange(text, i)}
                                        onKeyPress={(e) => handleCellKeyPress(e, i)}
                                        onFocus={() => setFocusedCell(i)}
                                        onBlur={() => setFocusedCell(null)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        editable={!isVerifying}
                                        selectTextOnFocus
                                        style={[otpCellStyle.cell, { borderColor: error ? '#f87171' : focusedCell === i ? '#f59e0b' : '#d1d5db' }]}
                                    />
                                ))}
                            </Box>
                            {error ? <Text className="mt-2 text-center text-sm text-red-500">{error}</Text> : null}
                        </Box>
                        <Box className="mb-6 items-center">
                            {secondsLeft > 0 ? (
                                <Text className="text-sm text-gray-500">Code expires in <Text className="font-semibold text-amber-500">{formatTime(secondsLeft)}</Text></Text>
                            ) : (
                                <Text className="text-sm text-red-500">Code expired. Please request a new one.</Text>
                            )}
                        </Box>
                        <Button onPress={() => handleVerify(otp)} isDisabled={isVerifying || otp.length < 6} className="w-full rounded-xl bg-amber-400 data-[active=true]:bg-amber-500 data-[disabled=true]:opacity-50" size="lg">
                            {isVerifying && <ButtonSpinner color="#1f2937" />}
                            <ButtonText className="font-semibold text-base text-gray-900">Verify</ButtonText>
                        </Button>
                        <Box className="mt-6 flex-row items-center justify-center gap-1">
                            <Text className="text-base text-gray-500">Didn't receive the code?</Text>
                            <Button variant="link" size="sm" onPress={handleResend} isDisabled={isResending || isVerifying}><ButtonText className="font-semibold text-sm text-amber-500">{isResending ? 'Sending...' : 'Resend'}</ButtonText></Button>
                        </Box>
                    </Box>
                </Box>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const otpCellStyle = StyleSheet.create({
    cell: {
        flex: 1,
        aspectRatio: 1,
        maxWidth: 52,
        borderWidth: 2,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        backgroundColor: '#f9fafb',
    },
});
