import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/ui/app-button';
import { OtpInput } from '@/components/ui/otp-input';
import { Screen } from '@/components/ui/screen';
import { ApiError, authApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

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
        <Screen>
            <View className="mb-6">
                <AppButton title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
            </View>
            <View className="flex-1 justify-center">
                <View className="mb-10">
                    <Text className="text-3xl font-bold text-gray-900">Check your email</Text>
                    <Text className="mt-2 text-base text-gray-500">
                        We sent a 6-digit code to <Text className="font-semibold text-gray-700">{maskedEmail}</Text>
                    </Text>
                </View>
                <View className="mb-6">
                    <OtpInput value={otp} onChange={(val) => { setOtp(val); setError(''); }} error={error} disabled={isVerifying} autoFocus />
                </View>
                <View className="mb-6 items-center">
                    {secondsLeft > 0 ? (
                        <Text className="text-sm text-gray-500">Code expires in <Text className="font-semibold text-amber-500">{formatTime(secondsLeft)}</Text></Text>
                    ) : (
                        <Text className="text-sm text-red-500">Code expired. Please request a new one.</Text>
                    )}
                </View>
                <AppButton title="Verify" onPress={() => handleVerify(otp)} isLoading={isVerifying} disabled={otp.length < 6} fullWidth size="lg" />
                <View className="mt-6 flex-row items-center justify-center gap-1">
                    <Text className="text-base text-gray-500">Didn't receive the code?</Text>
                    <AppButton title={isResending ? 'Sending...' : 'Resend'} variant="ghost" size="sm" onPress={handleResend} disabled={isResending || isVerifying} />
                </View>
            </View>
        </Screen>
    );
}
