import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, ApiError } from '@/lib/api';
import { storage } from '@/lib/storage';

interface User {
    id: string;
    email: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthActions {
    signOut: () => Promise<void>;
    setTokensAndUser: (access: string, refresh: string) => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            const token = await storage.getAccessToken();
            if (!token) {
                setIsLoading(false);
                return;
            }
            const me = await authApi.me();
            setUser(me);
        } catch (err) {
            // Token invalid or expired — try refresh
            try {
                const refresh = await storage.getRefreshToken();
                if (!refresh) throw new Error('No refresh token');
                const { access } = await authApi.refreshToken(refresh);
                await storage.setTokens(access, refresh);
                const me = await authApi.me();
                setUser(me);
            } catch {
                await storage.clearTokens();
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const setTokensAndUser = useCallback(async (access: string, refresh: string) => {
        await storage.setTokens(access, refresh);
        const me = await authApi.me();
        setUser(me);
    }, []);

    const signOut = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (_err) {
            // silently ignore server errors on logout
        } finally {
            await storage.clearTokens();
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                setTokensAndUser,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
