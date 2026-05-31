import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';

import { listingsApi, BusinessListing } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function HomeScreen() {
    const { isAuthenticated, signOut } = useAuth();

    const [listings, setListings] = useState<BusinessListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadListings = useCallback(async (pageNum: number, refresh = false) => {
        try {
            if (pageNum === 1) setError(null);
            const data = await listingsApi.getPublic(pageNum);
            if (refresh || pageNum === 1) {
                setListings(data.results);
            } else {
                setListings(prev => [...prev, ...data.results]);
            }
            setHasMore(data.next !== null);
            setPage(pageNum);
        } catch {
            setError('Failed to load listings. Pull down to retry.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => { loadListings(1); }, [loadListings]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadListings(1, true);
    }, [loadListings]);

    const onLoadMore = useCallback(() => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        loadListings(page + 1);
    }, [hasMore, isLoadingMore, page, loadListings]);

    const handleAddBusiness = () => {
        router.push(isAuthenticated ? '/(tabs)/add-listing' : '/(auth)/login' as never);
    };

    const handleSignOut = useCallback(async () => {
        if (!isAuthenticated || isSigningOut) return;
        setIsSigningOut(true);
        try {
            await signOut();
            router.replace('/(auth)/login' as never);
        } finally {
            setIsSigningOut(false);
        }
    }, [isAuthenticated, isSigningOut, signOut]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <Box className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <Box className="mb-3 flex-row items-center justify-between">
                    <Box className="flex-row items-center gap-2">
                        <Box className="h-9 w-9 items-center justify-center rounded-xl bg-amber-400">
                            <Text className="text-base font-bold text-gray-900">D</Text>
                        </Box>
                        <Text className="text-xl font-bold text-gray-900">DYP</Text>
                    </Box>
                    <Box className="flex-row items-center gap-2">
                        {isAuthenticated ? (
                            <Pressable onPress={handleSignOut} disabled={isSigningOut}>
                                <Box className="flex-row items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2">
                                    <MaterialIcons name="logout" size={16} color="#4b5563" />
                                    <Text className="text-sm font-semibold text-gray-700">
                                        {isSigningOut ? 'Signing out...' : 'Logout'}
                                    </Text>
                                </Box>
                            </Pressable>
                        ) : null}
                        <Pressable onPress={handleAddBusiness}>
                            <Box className="flex-row items-center gap-1 rounded-xl bg-amber-400 px-4 py-2">
                                <MaterialIcons name="add" size={18} color="#1f2937" />
                                <Text className="text-sm font-semibold text-gray-900">Add Business</Text>
                            </Box>
                        </Pressable>
                    </Box>
                </Box>
                <Pressable onPress={() => router.push('/(tabs)/search' as never)}>
                    <Box className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <MaterialIcons name="search" size={18} color="#9ca3af" />
                        <Text className="flex-1 text-sm text-gray-400">Search businesses, services...</Text>
                    </Box>
                </Pressable>
            </Box>

            {isLoading ? (
                <Box className="flex-1 items-center justify-center">
                    <Spinner size="large" color="#f59e0b" />
                </Box>
            ) : error ? (
                <Box className="flex-1 items-center justify-center px-6 gap-4">
                    <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                    <Text className="text-center text-sm text-gray-400">{error}</Text>
                    <Pressable onPress={onRefresh} className="rounded-xl bg-amber-400 px-6 py-3">
                        <Text className="font-semibold text-gray-900">Retry</Text>
                    </Pressable>
                </Box>
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        const locationLabel = [item.city, item.region].filter(Boolean).join(', ');
                        return (
                            <Pressable onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}>
                                <Card variant="ghost" className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <Box className="mb-1">
                                        <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>{item.business_title}</Text>
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
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                        <Box className="flex-1 items-center justify-center py-16 gap-2">
                            <MaterialIcons name="storefront" size={48} color="#d1d5db" />
                            <Text className="text-base font-medium text-gray-400">No businesses listed yet</Text>
                            <Text className="text-sm text-gray-400">Be the first to add your business!</Text>
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
