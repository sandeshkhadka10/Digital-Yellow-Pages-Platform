import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Keyboard,
    Linking,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';

import { listingsApi, BusinessListingSearchResult, SearchListingsParams } from '@/lib/api';
import { searchRadiusKmSchema } from '@/lib/search-validation';
import { Input, InputField } from '@/components/ui/input';

export default function SearchScreen() {
    const params = useLocalSearchParams<{ q?: string }>();
    const defaultRadiusKm = '10';

    const [query, setQuery] = useState(params.q ?? '');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
    const [useGps, setUseGps] = useState(false);
    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsLabel, setGpsLabel] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [results, setResults] = useState<BusinessListingSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runSearch = useCallback(async (pageNum: number, fresh = false) => {
        if (!query.trim() && !city.trim() && !region.trim() && !useGps) return;
        Keyboard.dismiss();

        if (fresh || pageNum === 1) setIsSearching(true);
        else setIsLoadingMore(true);
        setError(null);

        try {
            const searchParams: SearchListingsParams = { page: pageNum };
            if (query.trim()) searchParams.q = query.trim();
            if (city.trim()) searchParams.city = city.trim();
            if (region.trim()) searchParams.region = region.trim();
            if (useGps && gpsCoords) {
                const radiusResult = searchRadiusKmSchema.safeParse(radiusKm);
                if (!radiusResult.success) {
                    setError(radiusResult.error.issues[0]?.message ?? 'Radius must be a valid number.');
                    return;
                }

                searchParams.lat = gpsCoords.lat;
                searchParams.lng = gpsCoords.lng;
                searchParams.radius_km = radiusResult.data;
            }

            const data = await listingsApi.search(searchParams);
            if (fresh || pageNum === 1) {
                setResults(data.results);
            } else {
                setResults(prev => [...prev, ...data.results]);
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
    }, [query, city, region, useGps, gpsCoords, radiusKm]);

    useEffect(() => {
        if (params.q) runSearch(1, true);
    }, [params.q, runSearch]);

    const handleGetLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setGpsLabel(place ? [place.city, place.region].filter(Boolean).join(', ') : 'Current location');
            setUseGps(true);
        } catch {
            setError('Could not get your location. Please try again.');
        }
    };

    const handleDisableGps = () => {
        setUseGps(false);
        setGpsCoords(null);
        setGpsLabel('');
    };

    const onLoadMore = () => {
        if (!hasMore || isLoadingMore || isSearching) return;
        runSearch(page + 1);
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(tabs)');
    };

    const handleResetSearch = () => {
        Keyboard.dismiss();
        setQuery('');
        setCity('');
        setRegion('');
        setRadiusKm(defaultRadiusKm);
        setUseGps(false);
        setGpsCoords(null);
        setGpsLabel('');
        setShowFilters(false);
        setResults([]);
        setIsSearching(false);
        setIsLoadingMore(false);
        setHasSearched(false);
        setPage(1);
        setHasMore(false);
        setError(null);
    };

    const canReset = hasSearched
        || query.length > 0
        || city.length > 0
        || region.length > 0
        || useGps
        || radiusKm !== defaultRadiusKm;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <Box className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <Box className="mb-3 flex-row items-center gap-3">
                    <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                    </Pressable>
                    <Text className="text-xl font-bold text-gray-900">Search</Text>
                </Box>

                <Box className="mb-2 flex-row items-center gap-2">
                    <Box className="flex-1 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <MaterialIcons name="search" size={18} color="#9ca3af" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Plumber, Doctor, Auto Repair..."
                            placeholderTextColor="#9ca3af"
                            returnKeyType="search"
                            onSubmitEditing={() => runSearch(1, true)}
                            className="flex-1 text-sm text-gray-900"
                        />
                        {query.length > 0 && (
                            <Pressable onPress={() => setQuery('')}>
                                <MaterialIcons name="close" size={16} color="#9ca3af" />
                            </Pressable>
                        )}
                    </Box>
                    <Pressable
                        onPress={() => runSearch(1, true)}
                        className="items-center justify-center rounded-xl bg-amber-400 p-3 active:bg-amber-500"
                    >
                        <MaterialIcons name="search" size={20} color="#1f2937" />
                    </Pressable>
                    {canReset ? (
                        <Pressable
                            onPress={handleResetSearch}
                            className="items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-3 active:bg-gray-50"
                        >
                            <Text className="text-sm font-semibold text-gray-600">Reset</Text>
                        </Pressable>
                    ) : null}
                </Box>

                <Pressable onPress={() => setShowFilters(v => !v)} className="flex-row items-center gap-1 self-start">
                    <MaterialIcons name={showFilters ? 'expand-less' : 'tune'} size={16} color="#f59e0b" />
                    <Text className="text-sm font-medium text-amber-500">
                        {showFilters ? 'Hide filters' : 'Filters & Location'}
                    </Text>
                </Pressable>

                {showFilters && (
                    <Box className="mt-3 gap-2">
                        <Box className="flex-row gap-2">
                            <Box className="flex-1">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">City</Text>
                                <Input variant="outline" className="rounded-xl border-gray-300 bg-white">
                                    <InputField value={city} onChangeText={setCity} placeholder="e.g. Kathmandu" returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                                </Input>
                            </Box>
                            <Box className="flex-1">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">Region</Text>
                                <Input variant="outline" className="rounded-xl border-gray-300 bg-white">
                                    <InputField value={region} onChangeText={setRegion} placeholder="e.g. Bagmati" returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                                </Input>
                            </Box>
                        </Box>
                        <Box className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <Box className="flex-row items-center justify-between">
                                <Text className="text-sm font-medium text-gray-700">GPS Search</Text>
                                {useGps ? (
                                    <Pressable onPress={handleDisableGps}>
                                        <Text className="text-xs text-red-400">Remove</Text>
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={handleGetLocation} className="flex-row items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5">
                                        <MaterialIcons name="my-location" size={14} color="#1f2937" />
                                        <Text className="text-xs font-semibold text-gray-900">Use my location</Text>
                                    </Pressable>
                                )}
                            </Box>
                            {useGps && gpsLabel ? (
                                <Box className="mt-2 gap-2">
                                    <Text className="text-xs text-green-600">Location: {gpsLabel}</Text>
                                    <Box>
                                        <Text className="mb-1.5 text-sm font-medium text-gray-700">Radius (km)</Text>
                                        <Input variant="outline" className="rounded-xl border-gray-300 bg-white">
                                            <InputField value={radiusKm} onChangeText={setRadiusKm} placeholder="10" keyboardType="numeric" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                                        </Input>
                                    </Box>
                                </Box>
                            ) : null}
                        </Box>
                    </Box>
                )}
            </Box>

            {isSearching ? (
                <Box className="flex-1 items-center justify-center">
                    <Spinner size="large" color="#f59e0b" />
                    <Text className="mt-3 text-sm text-gray-400">Searching...</Text>
                </Box>
            ) : error && results.length === 0 ? (
                <Box className="flex-1 items-center justify-center px-6">
                    <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                    <Text className="mt-3 text-center text-sm text-gray-400">{error}</Text>
                </Box>
            ) : !hasSearched ? (
                <Box className="flex-1 items-center justify-center px-6">
                    <MaterialIcons name="search" size={48} color="#e5e7eb" />
                    <Text className="mt-4 text-base font-medium text-gray-300">Enter a keyword to search</Text>
                    <Text className="mt-1 text-sm text-gray-300">Try {'"Plumber"'} {'"Cardiologist"'} or {'"Auto Repair"'}</Text>
                </Box>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        const locationLabel = [item.city, item.region].filter(Boolean).join(', ');
                        const distanceLabel = item.distance_km != null
                            ? item.distance_km < 1
                                ? `${Math.round(item.distance_km * 1000)}m`
                                : `${item.distance_km.toFixed(1)}km`
                            : null;
                        return (
                            <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}>
                                <Card variant="ghost" className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <Box className="mb-1 flex-row items-start justify-between">
                                        <Text className="flex-1 text-base font-semibold text-gray-900" numberOfLines={2}>{item.business_title}</Text>
                                        {distanceLabel ? (
                                            <Box className="ml-2 rounded-full bg-amber-50 px-2 py-0.5">
                                                <Text className="text-xs font-medium text-amber-600">{distanceLabel}</Text>
                                            </Box>
                                        ) : null}
                                    </Box>
                                    <Text className="mb-3 text-sm text-gray-500" numberOfLines={3}>{item.service_detail}</Text>
                                    {locationLabel ? (
                                        <Box className="mb-3 flex-row items-center gap-1">
                                            <MaterialIcons name="location-on" size={14} color="#9ca3af" />
                                            <Text className="text-xs text-gray-400">{locationLabel}</Text>
                                        </Box>
                                    ) : null}
                                    <Box className="flex-row gap-2">
                                        <Pressable onPress={() => Linking.openURL(`tel:${item.phone_number}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 active:bg-amber-500">
                                            <MaterialIcons name="phone" size={16} color="#1f2937" />
                                            <Text className="text-sm font-semibold text-gray-900">Call</Text>
                                        </Pressable>
                                        {item.latitude != null && item.longitude != null ? (
                                            <Pressable onPress={() => Linking.openURL(`https://maps.google.com/maps?q=${item.latitude},${item.longitude}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2.5 active:bg-gray-50">
                                                <MaterialIcons name="map" size={16} color="#6b7280" />
                                                <Text className="text-sm font-semibold text-gray-600">Map</Text>
                                            </Pressable>
                                        ) : null}
                                    </Box>
                                </Card>
                            </Pressable>
                        );
                    }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                        <Box className="flex-1 items-center justify-center py-16 gap-2">
                            <MaterialIcons name="search-off" size={48} color="#d1d5db" />
                            <Text className="text-base font-medium text-gray-400">No results found</Text>
                            <Text className="text-sm text-gray-400">Try different keywords or broaden your filters</Text>
                        </Box>
                    }
                    ListFooterComponent={isLoadingMore ? (
                        <Box className="py-4 items-center"><Spinner size="small" color="#f59e0b" /></Box>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
}
