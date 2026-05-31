import React, { useState } from 'react';
import { TextInput, KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface FormInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    hint?: string;
    maxLength?: number;
    returnKeyType?: ReturnKeyTypeOptions;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    secureTextEntry?: boolean;
}

export function FormInput({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    hint,
    maxLength,
    returnKeyType,
    keyboardType,
    autoCapitalize,
    secureTextEntry,
}: FormInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const borderColor = error
        ? '#f87171'
        : isFocused
            ? '#f59e0b'
            : '#d1d5db';

    const backgroundColor = error
        ? '#fef2f2'
        : isFocused
            ? '#fffbeb'
            : '#ffffff';

    return (
        <Box>
            <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                maxLength={maxLength}
                returnKeyType={returnKeyType}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                secureTextEntry={secureTextEntry}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    height: 44,
                    borderWidth: 1,
                    borderColor,
                    borderRadius: 12,
                    backgroundColor,
                    paddingHorizontal: 12,
                    fontSize: 14,
                    color: '#111827',
                }}
            />
            {error ? (
                <Text className="mt-1 text-xs text-red-500">{error}</Text>
            ) : hint ? (
                <Text className="mt-1 text-xs text-gray-400">{hint}</Text>
            ) : null}
        </Box>
    );
}
