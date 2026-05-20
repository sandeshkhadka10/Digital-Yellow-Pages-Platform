import {
    ActivityIndicator,
    Pressable,
    Text,
    View,
    type PressableProps,
} from "react-native";

import { cn } from "@/utils/cn";

type GoogleSignInButtonProps = Omit<PressableProps, "children"> & {
    loading?: boolean;
    label?: string;
};

/**
 * Google-branded sign-in button that follows the Google sign-in button
 * guidelines (white background, Google icon, branded text).
 */
export function GoogleSignInButton({
    loading = false,
    disabled,
    label = "Continue with Google",
    className,
    ...rest
}: GoogleSignInButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={isDisabled}
            className={cn(
                "h-14 flex-row items-center justify-center rounded-2xl border border-slate-200",
                "bg-white active:bg-slate-50",
                "dark:border-slate-700 dark:bg-slate-900 dark:active:bg-slate-800",
                isDisabled && "opacity-50",
                className
            )}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#4285F4" />
            ) : (
                <>
                    {/* Google "G" icon built from colored squares */}
                    <View className="mr-3 h-5 w-5 items-center justify-center">
                        <GoogleIcon />
                    </View>
                    <Text className="text-base font-semibold text-ink-light dark:text-ink-dark">
                        {label}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

/** Minimal Google "G" logo using colored SVG-like View blocks */
function GoogleIcon() {
    return (
        <View style={{ width: 20, height: 20 }}>
            {/* Top-right: Blue */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    backgroundColor: "#4285F4",
                    borderTopRightRadius: 10,
                }}
            />
            {/* Top-left: Red */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: 10,
                    height: 10,
                    backgroundColor: "#EA4335",
                    borderTopLeftRadius: 10,
                }}
            />
            {/* Bottom-left: Yellow */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 10,
                    height: 10,
                    backgroundColor: "#FBBC05",
                    borderBottomLeftRadius: 10,
                }}
            />
            {/* Bottom-right: Green */}
            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    backgroundColor: "#34A853",
                    borderBottomRightRadius: 10,
                }}
            />
            {/* Center white circle overlay */}
            <View
                style={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    width: 10,
                    height: 10,
                    backgroundColor: "white",
                    borderRadius: 5,
                }}
            />
        </View>
    );
}
