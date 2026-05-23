import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputKeyPressEventData, View } from 'react-native';

const OTP_LENGTH = 6;

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function OtpInput({ value, onChange, error, disabled = false, autoFocus = true }: OtpInputProps) {
    const inputs = useRef<(TextInput | null)[]>([]);
    const [focused, setFocused] = useState<number | null>(autoFocus ? 0 : null);

    useEffect(() => {
        if (autoFocus) {
            setTimeout(() => inputs.current[0]?.focus(), 100);
        }
    }, [autoFocus]);

    const digits = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

    const handleChange = useCallback(
        (text: string, index: number) => {
            const digit = text.replace(/\D/g, '').slice(-1);
            const newDigits = [...digits];
            newDigits[index] = digit;
            const newValue = newDigits.join('').replace(/ /g, '');
            onChange(newValue);
            if (digit && index < OTP_LENGTH - 1) {
                inputs.current[index + 1]?.focus();
            }
        },
        [digits, onChange],
    );

    const handleKeyPress = useCallback(
        (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
            if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
                const newDigits = [...digits];
                newDigits[index - 1] = '';
                onChange(newDigits.join('').replace(/ /g, ''));
                inputs.current[index - 1]?.focus();
            }
        },
        [digits, onChange],
    );

    return (
        <View>
            <View className="flex-row justify-between gap-2">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const borderColor = error ? '#f87171' : focused === i ? '#f59e0b' : '#d1d5db';
                    return (
                        <TextInput
                            key={i}
                            ref={(el) => { inputs.current[i] = el; }}
                            value={digits[i] === ' ' ? '' : digits[i]}
                            onChangeText={(text) => handleChange(text, i)}
                            onKeyPress={(e) => handleKeyPress(e, i)}
                            onFocus={() => setFocused(i)}
                            onBlur={() => setFocused(null)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!disabled}
                            style={[styles.cell, { borderColor }]}
                            selectTextOnFocus
                        />
                    );
                })}
            </View>
            {error && <Text className="mt-2 text-center text-sm text-red-500">{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
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
