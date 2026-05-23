import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
    title: string;
    variant?: Variant;
    size?: Size;
    isLoading?: boolean;
    fullWidth?: boolean;
    disabled?: boolean;
    onPress?: () => void;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-amber-400 active:bg-amber-500',
    secondary: 'bg-gray-800 active:bg-gray-700',
    outline: 'border-2 border-amber-400 bg-transparent active:bg-amber-50',
    ghost: 'bg-transparent active:bg-amber-50',
};

const textClasses: Record<Variant, string> = {
    primary: 'text-gray-900',
    secondary: 'text-white',
    outline: 'text-amber-500',
    ghost: 'text-amber-500',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2.5',
    lg: 'px-5 py-3.5',
};

const textSizeClasses: Record<Size, string> = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-base',
};

export function AppButton({
    title,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    disabled,
    onPress,
}: AppButtonProps) {
    const isDisabled = disabled || isLoading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            className={[
                'flex-row items-center justify-center rounded-xl',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? 'w-full' : 'self-start',
                isDisabled ? 'opacity-50' : '',
            ].join(' ')}
        >
            {isLoading && (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? '#1f2937' : '#f59e0b'}
                    style={{ marginRight: 8 }}
                />
            )}
            <Text className={`font-semibold ${textSizeClasses[size]} ${textClasses[variant]}`}>
                {title}
            </Text>
        </Pressable>
    );
}
