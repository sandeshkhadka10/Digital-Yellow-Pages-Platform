import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    ChevronUp,
    LocateFixed,
    Search,
    SearchX,
    SlidersHorizontal,
    X,
} from 'lucide-react';

import { listingsApi } from '../lib/api';
import { searchParamsSchema } from '../lib/zod/search-schema';
import { AppInput } from './ui/AppInput';
import { ListingCard } from './ui/ListingCard';

/**
 * SearchPage — full search screen matching the mobile search tab.
 * Supports keyword, city, region, and GPS-based radius search.
 * Handles pagination via IntersectionObserver (infinite scroll).
 *
 * @param {{ onListingClick?: (listing: object) => void }} props
 */
export function SearchPage({ onListingClick }) {
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [radiusKm, setRadiusKm] = useState('10');
    const [useGps, setUseGps] = useState(false);
    const [gpsCoords, setGpsCoords] = useState(null);
    const [gpsLabel, setGpsLabel] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState(null);

    const sentinelRef = useRef(null);

    const runSearch = useCallback(
        async (pageNum, fresh = false) => {
            if (!query.trim() && !city.trim() && !region.trim() && !useGps) return;

            if (fresh || pageNum === 1) setIsSearching(true);
            else setIsLoadingMore(true);
            setError(null);

            try {
                const searchParams = { page: pageNum };
                if (query.trim()) searchParams.q = query.trim();
                if (city.trim()) searchParams.city = city.trim();
                if (region.trim()) searchParams.region = region.trim();
                if (useGps && gpsCoords) {
                    searchParams.lat = gpsCoords.lat;
                    searchParams.lng = gpsCoords.lng;
                    searchParams.radius_km = radiusKm;
                }

                const parseResult = searchParamsSchema.safeParse(searchParams);
                if (!parseResult.success) {
                    setError(parseResult.error.issues[0]?.message || 'Invalid search input.');
                    setIsSearching(false);
                    setIsLoadingMore(false);
                    return;
                }

                const data = await listingsApi.search(parseResult.data);
                if (fresh || pageNum === 1) {
                    setResults(data.results);
                } else {
                    setResults((prev) => [...prev, ...data.results]);
                }
                setHasMore(data.next !== null);
                setPage(pageNum);
                setHasSearched(true);
            } catch {
                setError('Search failed. Please try again.');
            } finally {
                setIsSearching(false);
                setIsLoadingMore(false);
            }
        },
        [query, city, region, useGps, gpsCoords, radiusKm],
    );

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasMore &&
                    !isLoadingMore &&
                    !isSearching
                ) {
                    runSearch(page + 1);
                }
            },
            { threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isSearching, page, runSearch]);

    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }
        try {
            const position = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                }),
            );
            const { latitude, longitude } = position.coords;
            setGpsCoords({ lat: latitude, lng: longitude });
            setUseGps(true);
            // Reverse geocode via Nominatim (free, no API key)
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                    { headers: { 'Accept-Language': 'en' } },
                );
                const geo = await res.json();
                const placeName =
                    geo.address?.city ||
                    geo.address?.town ||
                    geo.address?.village ||
                    '';
                const stateName = geo.address?.state || '';
                setGpsLabel(
                    [placeName, stateName].filter(Boolean).join(', ') ||
                    'Current location',
                );
            } catch {
                setGpsLabel('Current location');
            }
        } catch {
            setError(
                'Could not get your location. Please allow location access and try again.',
            );
        }
    };

    const handleDisableGps = () => {
        setUseGps(false);
        setGpsCoords(null);
        setGpsLabel('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') runSearch(1, true);
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <h1 className="mb-3 text-xl font-bold text-gray-900">Search</h1>

                {/* Search bar + button */}
                <div className="mb-2 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <Search size={18} color="#9ca3af" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Plumber, Doctor, Auto Repair..."
                            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        />
                        {query.length > 0 && (
                            <button
                                onClick={() => setQuery('')}
                                className="rounded p-0.5 hover:bg-gray-200"
                                aria-label="Clear search"
                            >
                                <X size={16} color="#9ca3af" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => runSearch(1, true)}
                        className="rounded-xl bg-amber-400 p-3 transition-colors hover:bg-amber-500 active:bg-amber-500"
                        aria-label="Search"
                    >
                        <Search size={20} color="#1f2937" />
                    </button>
                </div>

                {/* Filter toggle */}
                <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-1 text-sm font-medium text-amber-500"
                >
                    {showFilters ? (
                        <ChevronUp size={16} color="#f59e0b" />
                    ) : (
                        <SlidersHorizontal size={16} color="#f59e0b" />
                    )}
                    {showFilters ? 'Hide filters' : 'Filters & Location'}
                </button>

                {/* Filter panel */}
                {showFilters && (
                    <div className="mt-3 flex flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <AppInput
                                    label="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="e.g. Kathmandu"
                                />
                            </div>
                            <div className="flex-1">
                                <AppInput
                                    label="Region"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    placeholder="e.g. Bagmati"
                                />
                            </div>
                        </div>

                        {/* GPS panel */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    GPS Search
                                </span>
                                {useGps ? (
                                    <button
                                        onClick={handleDisableGps}
                                        className="text-xs text-red-400 hover:text-red-500"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGetLocation}
                                        className="flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 transition-colors hover:bg-amber-500"
                                    >
                                        <LocateFixed size={14} color="#1f2937" />
                                        <span className="text-xs font-semibold text-gray-900">
                                            Use my location
                                        </span>
                                    </button>
                                )}
                            </div>
                            {useGps && gpsLabel && (
                                <div className="mt-2 flex flex-col gap-2">
                                    <span className="text-xs text-green-600">
                                        Location: {gpsLabel}
                                    </span>
                                    <AppInput
                                        label="Radius (km)"
                                        value={radiusKm}
                                        onChange={(e) => setRadiusKm(e.target.value)}
                                        placeholder="10"
                                        type="number"
                                        min="0.1"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Content ────────────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                {isSearching ? (
                    <div className="flex flex-1 flex-col items-center justify-center">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                        <p className="mt-3 text-sm text-gray-400">Searching...</p>
                    </div>
                ) : error && results.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6">
                        <AlertCircle size={40} color="#d1d5db" />
                        <p className="mt-3 text-center text-sm text-gray-400">{error}</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6">
                        <Search size={48} color="#e5e7eb" />
                        <p className="mt-4 text-base font-medium text-gray-300">
                            Enter a keyword to search
                        </p>
                        <p className="mt-1 text-sm text-gray-300">
                            Try &ldquo;Plumber&rdquo;, &ldquo;Cardiologist&rdquo; or &ldquo;Auto
                            Repair&rdquo;
                        </p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
                        <SearchX size={48} color="#d1d5db" />
                        <p className="text-base font-medium text-gray-400">
                            No results found
                        </p>
                        <p className="text-sm text-gray-400">
                            Try different keywords or broaden your filters
                        </p>
                    </div>
                ) : (
                    <div className="px-4 pb-6 pt-3">
                        {results.map((item) => (
                            <ListingCard
                                key={item.id}
                                listing={item}
                                onClick={() => onListingClick?.(item)}
                            />
                        ))}

                        {/* Infinite scroll sentinel */}
                        <div ref={sentinelRef} className="h-1" />

                        {isLoadingMore && (
                            <div className="flex justify-center py-4">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
