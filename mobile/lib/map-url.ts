export interface Coordinates {
    latitude: number;
    longitude: number;
}

function toCoordinates(lat: number, lng: number): Coordinates | null {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90) return null;
    if (lng < -180 || lng > 180) return null;
    return { latitude: lat, longitude: lng };
}

function parseLatLngText(text: string): Coordinates | null {
    const directPair = text.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (directPair) {
        const lat = Number(directPair[1]);
        const lng = Number(directPair[2]);
        const coords = toCoordinates(lat, lng);
        if (coords) return coords;
    }

    const atPair = text.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
    if (atPair) {
        const lat = Number(atPair[1]);
        const lng = Number(atPair[2]);
        const coords = toCoordinates(lat, lng);
        if (coords) return coords;
    }

    const osmMap = text.match(/map=\d+(?:\.\d+)?\/(-?\d{1,2}(?:\.\d+)?)\/(-?\d{1,3}(?:\.\d+)?)/);
    if (osmMap) {
        const lat = Number(osmMap[1]);
        const lng = Number(osmMap[2]);
        const coords = toCoordinates(lat, lng);
        if (coords) return coords;
    }

    return null;
}

export function extractCoordinatesFromMapUrl(rawUrl: string): Coordinates | null {
    const input = rawUrl.trim();
    if (!input) return null;

    try {
        const url = new URL(input);

        const searchParamKeys = ['q', 'query', 'll', 'sll', 'daddr', 'destination', 'center', 'mlatlon'];
        for (const key of searchParamKeys) {
            const value = url.searchParams.get(key);
            if (!value) continue;
            const coords = parseLatLngText(value);
            if (coords) return coords;
        }

        const mlat = url.searchParams.get('mlat');
        const mlon = url.searchParams.get('mlon');
        if (mlat && mlon) {
            const coords = toCoordinates(Number(mlat), Number(mlon));
            if (coords) return coords;
        }

        const combinedText = [
            decodeURIComponent(url.pathname),
            decodeURIComponent(url.search),
            decodeURIComponent(url.hash),
        ].join(' ');

        return parseLatLngText(combinedText);
    } catch {
        return null;
    }
}
