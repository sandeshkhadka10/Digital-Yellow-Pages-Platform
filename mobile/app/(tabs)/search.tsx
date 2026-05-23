import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';

import { listingsApi, BusinessListingSearchResult, SearchListingsParams } from '@/lib/api';
import { ListingCard } from '@/components/ui/listing-card';
import { AppInput } from '@/components/ui/app-input';

export default function SearchScreen() {
    const params = useLocalSearchParams<{ q?: string }>();

    const [query, setQuery] = useState(params.q ?? '');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [radiusKm, setRadiusKm] = useState('10');
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
                searchParams.lat = gpsCoords.lat;
                searchParams.lng = gpsCoords.lng;
                searchParams.radius_km = parseFloat(radiusKm) || 10;
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

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <Text className="mb-3 text-xl font-bold text-gray-900">Search</Text>

                <View className="mb-2 flex-row items-center gap-2">
                    <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
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
                    </View>
                    <Pressable
                        onPress={() => runSearch(1, true)}
                        className="items-center justify-center rounded-xl bg-amber-400 p-3 active:bg-amber-500"
                    >
                        <MaterialIcons name="search" size={20} color="#1f2937" />
                    </Pressable>
                </View>

                <Pressable onPress={() => setShowFilters(v => !v)} className="flex-row items-center gap-1 self-start">
                    <MaterialIcons name={showFilters ? 'expand-less' : 'tune'} size={16} color="#f59e0b" />
                    <Text className="text-sm font-medium text-amber-500">
                        {showFilters ? 'Hide filters' : 'Filters & Location'}
                    </Text>
                </Pressable>

                {showFilters && (
                    <View className="mt-3 gap-2">
                        <View className="flex-row gap-2">
                            <View className="flex-1">
                                <AppInput label="City" value={city} onChangeText={setCity} placeholder="e.g. Kathmandu" returnKeyType="next" />
                            </View>
                            <View className="flex-1">
                                <AppInput label="Region" value={region} onChangeText={setRegion} placeholder="e.g. Bagmati" returnKeyType="next" />
                            </View>
                        </View>
                        <View className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <View className="flex-row items-center justify-between">
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
                            </View>
                            {useGps && gpsLabel ? (
                                <View className="mt-2 gap-2">
                                    <Text className="text-xs text-green-600">Location: {gpsLabel}</Text>
                                    <AppInput label="Radius (km)" value={radiusKm} onChangeText={setRadiusKm} placeholder="10" keyboardType="numeric" />
                                </View>
                            ) : null}
                        </View>
                    </View>
                )}
            </View>

            {isSearching ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text className="mt-3 text-sm text-gray-400">Searching...</Text>
                </View>
            ) : error && results.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                    <Text className="mt-3 text-center text-sm text-gray-400">{error}</Text>
                </View>
            ) : !hasSearched ? (
                <View className="flex-1 items-center justify-center px-6">
                    <MaterialIcons name="search" size={48} color="#e5e7eb" />
                    <Text className="mt-4 text-base font-medium text-gray-300">Enter a keyword to search</Text>
                    <Text className="mt-1 text-sm text-gray-300">Try {'"Plumber"'} {'"Cardiologist"'} or {'"Auto Repair"'}</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ListingCard
                            listing={item}
                            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-16 gap-2">
                            <MaterialIcons name="search-off" size={48} color="#d1d5db" />
                            <Text className="text-base font-medium text-gray-400">No results found</Text>
                            <Text className="text-sm text-gray-400">Try different keywords or broaden your filters</Text>
                        </View>
                    }
                    ListFooterComponent={isLoadingMore ? (
                        <View className="py-4 items-center"><ActivityIndicator size="small" color="#f59e0b" /></View>
                    ) : null}
                />
            )}
        </SafeAreaView>
    );
}
