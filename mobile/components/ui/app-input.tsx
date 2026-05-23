import React, { forwardRef } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface AppInputProps extends TextInputProps {
    label?: string;
    error?: string;
    hint?: string;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
    { label, error, hint, ...rest },
    ref,
) {
    return (
        <View>
            {label && (
                <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>
            )}
            <TextInput
                ref={ref}
                placeholderTextColor="#9ca3af"
                className={[
                    'rounded-xl border px-4 py-3 text-sm text-gray-900',
                    error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
                ].join(' ')}
                {...rest}
            />
            {error ? (
                <Text className="mt-1 text-xs text-red-500">{error}</Text>
            ) : hint ? (
                <Text className="mt-1 text-xs text-gray-400">{hint}</Text>
            ) : null}
        </View>
    );
});
