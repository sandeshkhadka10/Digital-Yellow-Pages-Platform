import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'dyp_access_token';
const REFRESH_TOKEN_KEY = 'dyp_refresh_token';

export const storage = {
    async getAccessToken(): Promise<string | null> {
        return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    },

    async getRefreshToken(): Promise<string | null> {
        return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    },

    async setTokens(access: string, refresh: string): Promise<void> {
        await Promise.all([
            SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access),
            SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh),
        ]);
    },

    async clearTokens(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
            SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        ]);
    },
};
