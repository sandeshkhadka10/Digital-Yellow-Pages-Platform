import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export interface ListingCardData {
    id: string;
    business_title: string;
    service_detail: string;
    phone_number: string;
    business_email: string;
    location_url: string;
    city?: string;
    region?: string;
    distance_km?: number | null;
}

interface ListingCardProps {
    listing: ListingCardData;
    onPress?: () => void;
}

export function ListingCard({ listing, onPress }: ListingCardProps) {
    const handleCall = () => Linking.openURL(`tel:${listing.phone_number}`);
    const handleMap = () => Linking.openURL(listing.location_url);

    const locationParts = [listing.city, listing.region].filter(Boolean);
    const locationLabel = locationParts.join(', ');

    const distanceLabel =
        listing.distance_km != null
            ? listing.distance_km < 1
                ? `${Math.round(listing.distance_km * 1000)}m`
                : `${listing.distance_km.toFixed(1)}km`
            : null;

    return (
        <Pressable onPress={onPress}>
            <View className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                {/* Title row */}
                <View className="mb-1 flex-row items-start justify-between">
                    <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={2}>
                        {listing.business_title}
                    </Text>
                    {distanceLabel && (
                        <View className="ml-2 rounded-full bg-amber-50 px-2 py-0.5">
                            <Text className="text-xs font-medium text-amber-600">{distanceLabel}</Text>
                        </View>
                    )}
                </View>

                {/* Service detail */}
                <Text className="mb-3 text-sm text-gray-500" numberOfLines={3}>
                    {listing.service_detail}
                </Text>

                {/* Location */}
                {locationLabel ? (
                    <View className="mb-3 flex-row items-center gap-1">
                        <MaterialIcons name="location-on" size={14} color="#9ca3af" />
                        <Text className="text-xs text-gray-400">{locationLabel}</Text>
                    </View>
                ) : null}

                {/* Action buttons */}
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={handleCall}
                        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 active:bg-amber-500"
                    >
                        <MaterialIcons name="phone" size={16} color="#1f2937" />
                        <Text className="text-sm font-semibold text-gray-900">Call</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleMap}
                        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 active:bg-gray-50"
                    >
                        <MaterialIcons name="map" size={16} color="#6b7280" />
                        <Text className="text-sm font-semibold text-gray-600">Map</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}
