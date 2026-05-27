import { MapPin, Map, Phone } from 'lucide-react';

/**
 * ListingCard — mirrors the mobile ListingCard component.
 *
 * @param {{
 *   listing: {
 *     id: string,
 *     business_title: string,
 *     service_detail: string,
 *     phone_number: string,
 *     business_email: string,
 *     latitude?: number | null,
 *     longitude?: number | null,
 *     city?: string,
 *     region?: string,
 *     distance_km?: number | null,
 *   },
 *   onClick?: () => void,
 * }} props
 */
export function ListingCard({ listing, onClick }) {
    const handleCall = (e) => {
        e.stopPropagation();
        window.open(`tel:${listing.phone_number}`);
    };

    const handleMap = (e) => {
        e.stopPropagation();
        if (listing.latitude != null && listing.longitude != null) {
            window.open(
                `https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}`,
                '_blank',
                'noopener,noreferrer',
            );
        }
    };

    const hasMap = listing.latitude != null && listing.longitude != null;

    const locationParts = [listing.city, listing.region].filter(Boolean);
    const locationLabel = locationParts.join(', ');

    const distanceLabel =
        listing.distance_km != null
            ? listing.distance_km < 1
                ? `${Math.round(listing.distance_km * 1000)}m`
                : `${listing.distance_km.toFixed(1)}km`
            : null;

    return (
        <div
            className="mb-3 cursor-pointer rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
            {/* Title row */}
            <div className="mb-1 flex items-start justify-between">
                <p className="flex-1 line-clamp-2 text-base font-semibold text-gray-900">
                    {listing.business_title}
                </p>
                {distanceLabel && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                        {distanceLabel}
                    </span>
                )}
            </div>

            {/* Service detail */}
            <p className="mb-3 line-clamp-3 text-sm text-gray-500">
                {listing.service_detail}
            </p>

            {/* Location */}
            {locationLabel && (
                <div className="mb-3 flex items-center gap-1">
                    <MapPin size={14} color="#9ca3af" />
                    <span className="text-xs text-gray-400">{locationLabel}</span>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleCall}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-500 active:bg-amber-500"
                >
                    <Phone size={16} color="#1f2937" />
                    Call
                </button>
                {hasMap && (
                    <button
                        onClick={handleMap}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 active:bg-gray-50"
                    >
                        <Map size={16} color="#6b7280" />
                        Map
                    </button>
                )}
            </div>
        </div>
    );
}
