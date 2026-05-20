import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

// Required on web to complete the auth session redirect
WebBrowser.maybeCompleteAuthSession();

export type GoogleUserInfo = {
    id: string;
    email: string;
    name: string;
    picture: string;
};

/**
 * Hook that wraps Google OAuth via expo-auth-session.
 *
 * Set the following in your .env file:
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 *
 * Create OAuth credentials at https://console.cloud.google.com/
 */
export function useGoogleAuth() {
    const [userInfo, setUserInfo] = useState<GoogleUserInfo | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    });

    useEffect(() => {
        if (response?.type === "success") {
            fetchUserInfo(response.authentication?.accessToken);
        } else if (response?.type === "error") {
            Alert.alert(
                "Google Sign-In Failed",
                response.error?.message ?? "Authentication failed. Please try again."
            );
        }
    }, [response]);

    async function fetchUserInfo(accessToken: string | undefined) {
        if (!accessToken) return;
        setIsLoadingUser(true);
        try {
            const res = await fetch("https://www.googleapis.com/userinfo/v2/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error("Failed to fetch user info");
            const data = (await res.json()) as GoogleUserInfo;
            setUserInfo(data);
            // TODO: Send data to your backend / set auth state here
            Alert.alert("Welcome!", `Signed in as ${data.email}`);
        } catch (err) {
            Alert.alert(
                "Google Sign-In Failed",
                err instanceof Error ? err.message : "Could not retrieve user info."
            );
        } finally {
            setIsLoadingUser(false);
        }
    }

    return {
        /** The prepared auth request – null until ready */
        request,
        /** Triggers the Google OAuth browser flow */
        promptAsync,
        /** True while the button should show a loading state */
        isLoading: !request || isLoadingUser,
        /** User info after a successful sign-in, null otherwise */
        userInfo,
    };
}
