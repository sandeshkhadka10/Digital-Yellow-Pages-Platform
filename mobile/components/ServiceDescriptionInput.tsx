import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

interface ServiceDescriptionInputProps {
    value: string;
    onChangeText: (text: string) => void;
    error?: string;
    maxLength?: number;
}

export function ServiceDescriptionInput({
    value,
    onChangeText,
    error,
    maxLength = 2000,
}: ServiceDescriptionInputProps) {
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
            <Text className="mb-1.5 text-sm font-medium text-gray-700">Service Description *</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder="Describe your services, specialties and offerings..."
                multiline
                maxLength={maxLength}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{
                    minHeight: 100,
                    borderWidth: 1,
                    borderColor,
                    borderRadius: 12,
                    backgroundColor,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#111827',
                    lineHeight: 20,
                }}
            />
            {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
            <Text className="mt-1 text-right text-xs text-gray-400">{value.length}/{maxLength}</Text>
        </Box>
    );
}
