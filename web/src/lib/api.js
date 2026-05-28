const BASE_URL = (import.meta.env.VITE_PUBLIC_SERVER_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

function extractErrorMessage(data, fallbackStatus) {
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (!data || typeof data !== 'object') return `Request failed with status ${fallbackStatus}`;

    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim();

    const messages = [];
    for (const [key, value] of Object.entries(data)) {
        if (key === 'detail') continue;
        if (Array.isArray(value)) {
            const first = value.find(v => typeof v === 'string' && v.trim());
            if (typeof first === 'string') { messages.push(`${key}: ${first.trim()}`); continue; }
        }
        if (typeof value === 'string' && value.trim()) messages.push(`${key}: ${value.trim()}`);
    }

    return messages.length > 0 ? messages.join('\n') : `Request failed with status ${fallbackStatus}`;
}

async function request(path) {
    const response = await fetch(`${BASE_URL}${path}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(response.status, extractErrorMessage(data, response.status));
    }
    return data;
}

export const listingsApi = {
    /**
     * @param {{ q?: string, city?: string, region?: string, lat?: number, lng?: number, radius_km?: number, page?: number }} params
     */
    search(params = {}) {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.city) qs.set('city', params.city);
        if (params.region) qs.set('region', params.region);
        if (params.lat !== undefined) qs.set('lat', String(params.lat));
        if (params.lng !== undefined) qs.set('lng', String(params.lng));
        if (params.radius_km !== undefined) qs.set('radius_km', String(params.radius_km));
        if (params.page) qs.set('page', String(params.page));
        return request(`/listings/search/?${qs.toString()}`);
    },
};
