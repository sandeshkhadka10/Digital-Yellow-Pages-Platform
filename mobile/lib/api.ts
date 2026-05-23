import { storage } from './storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getExpoDevHost() {
    const hostUri = Constants.expoConfig?.hostUri?.trim();
    if (!hostUri) {
        return null;
    }

    const host = hostUri.split(':')[0];
    if (!host || host === 'localhost' || host === '127.0.0.1') {
        return null;
    }

    return host;
}

function getBaseUrl() {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (configuredUrl) {
        return configuredUrl.replace(/\/$/, '');
    }

    if (__DEV__) {
        // In Expo Go on a physical device, use Metro's LAN host to reach local backend.
        const expoDevHost = getExpoDevHost();
        if (expoDevHost) {
            return `http://${expoDevHost}:8000/api`;
        }

        return Platform.OS === 'android'
            ? 'http://10.0.2.2:8000/api'
            : 'http://localhost:8000/api';
    }

    return 'http://127.0.0.1:8000/api';
}

const BASE_URL = getBaseUrl();

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    withAuth = false,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (withAuth) {
        const token = await storage.getAccessToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message =
            (data as { detail?: string }).detail ?? `Request failed with status ${response.status}`;
        throw new ApiError(response.status, message);
    }

    return data as T;
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export interface OtpResponse {
    detail: string;
}

export interface VerifyResponse {
    detail: string;
    is_new_user: boolean;
    access: string;
    refresh: string;
}

export const authApi = {
    /** Sign-up: request OTP (fails if user already exists) */
    signUpRequestOtp(email: string): Promise<OtpResponse> {
        return request<OtpResponse>('/auth/request-otp/', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    /** Sign-up: verify OTP → returns JWT tokens + creates user */
    signUpVerifyOtp(otp: string): Promise<VerifyResponse> {
        return request<VerifyResponse>('/auth/verify-otp/', {
            method: 'POST',
            body: JSON.stringify({ otp }),
        });
    },

    /** Login: request OTP (fails if user does NOT exist) */
    loginRequestOtp(email: string): Promise<OtpResponse> {
        return request<OtpResponse>('/auth/login/request-otp/', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    /** Login: verify OTP → returns JWT tokens */
    loginVerifyOtp(otp: string): Promise<VerifyResponse> {
        return request<VerifyResponse>('/auth/login/verify-otp/', {
            method: 'POST',
            body: JSON.stringify({ otp }),
        });
    },

    /** Refresh access token */
    refreshToken(refresh: string): Promise<{ access: string }> {
        return request<{ access: string }>('/auth/refresh/', {
            method: 'POST',
            body: JSON.stringify({ refresh }),
        });
    },

    /** Logout (client-side token deletion) */
    logout(): Promise<OtpResponse> {
        return request<OtpResponse>('/auth/logout/', { method: 'POST' }, true);
    },

    /** Get current user */
    me(): Promise<{ id: string; email: string }> {
        return request<{ id: string; email: string }>('/auth/me/', {}, true);
    },
};

// ─── Listing types ─────────────────────────────────────────────────────────────

export interface BusinessListing {
    id: string;
    owner_email: string;
    business_title: string;
    service_detail: string;
    phone_number: string;
    business_email: string;
    location_url: string;
    latitude: number | null;
    longitude: number | null;
    city: string;
    region: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BusinessListingSearchResult {
    id: string;
    business_title: string;
    service_detail: string;
    phone_number: string;
    business_email: string;
    location_url: string;
    distance_km: number | null;
    city: string;
    region: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface CreateListingPayload {
    business_title: string;
    service_detail: string;
    phone_number: string;
    business_email: string;
    location_url: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
}

export interface SearchListingsParams {
    q?: string;
    city?: string;
    region?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
    page?: number;
}

// ─── Listings endpoints ───────────────────────────────────────────────────────

export const listingsApi = {
    /** Get all public active listings (no auth) */
    getPublic(page = 1): Promise<PaginatedResponse<BusinessListing>> {
        return request<PaginatedResponse<BusinessListing>>(`/listings/public/?page=${page}`);
    },

    /** Get the authenticated user's own listings */
    getMyListings(page = 1): Promise<PaginatedResponse<BusinessListing>> {
        return request<PaginatedResponse<BusinessListing>>(`/listings/?page=${page}`, {}, true);
    },

    /** Create a new listing (auth required) */
    createListing(payload: CreateListingPayload): Promise<BusinessListing> {
        return request<BusinessListing>(
            '/listings/',
            { method: 'POST', body: JSON.stringify(payload) },
            true,
        );
    },

    /** Get single listing (public) */
    getListing(id: string): Promise<BusinessListing> {
        return request<BusinessListing>(`/listings/${id}/`);
    },

    /** Update a listing (owner only) */
    updateListing(id: string, payload: Partial<CreateListingPayload>): Promise<BusinessListing> {
        return request<BusinessListing>(
            `/listings/${id}/`,
            { method: 'PUT', body: JSON.stringify(payload) },
            true,
        );
    },

    /** Delete a listing (owner only, soft delete) */
    deleteListing(id: string): Promise<{ detail: string }> {
        return request<{ detail: string }>(`/listings/${id}/`, { method: 'DELETE' }, true);
    },

    /** Search listings (public) */
    search(params: SearchListingsParams): Promise<PaginatedResponse<BusinessListingSearchResult>> {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.city) qs.set('city', params.city);
        if (params.region) qs.set('region', params.region);
        if (params.lat !== undefined) qs.set('lat', String(params.lat));
        if (params.lng !== undefined) qs.set('lng', String(params.lng));
        if (params.radius_km !== undefined) qs.set('radius_km', String(params.radius_km));
        if (params.page) qs.set('page', String(params.page));
        return request<PaginatedResponse<BusinessListingSearchResult>>(
            `/listings/search/?${qs.toString()}`,
        );
    },
};
