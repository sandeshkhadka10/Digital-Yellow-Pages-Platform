import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { listingsApi, BusinessListing } from '@/lib/api';
import { ListingCard } from '@/components/ui/listing-card';
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
            <View className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <View className="mb-3 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                        <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-400">
                            <Text className="text-base font-bold text-gray-900">D</Text>
                        </View>
                        <Text className="text-xl font-bold text-gray-900">DYP</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        {isAuthenticated ? (
                            <Pressable onPress={handleSignOut} disabled={isSigningOut}>
                                <View className="flex-row items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2">
                                    <MaterialIcons name="logout" size={16} color="#4b5563" />
                                    <Text className="text-sm font-semibold text-gray-700">
                                        {isSigningOut ? 'Signing out...' : 'Logout'}
                                    </Text>
                                </View>
                            </Pressable>
                        ) : null}
                        <Pressable onPress={handleAddBusiness}>
                            <View className="flex-row items-center gap-1 rounded-xl bg-amber-400 px-4 py-2">
                                <MaterialIcons name="add" size={18} color="#1f2937" />
                                <Text className="text-sm font-semibold text-gray-900">Add Business</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
                <Pressable onPress={() => router.push('/(tabs)/search' as never)}>
                    <View className="flex-row items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <MaterialIcons name="search" size={18} color="#9ca3af" />
                        <Text className="flex-1 text-sm text-gray-400">Search businesses, services...</Text>
                    </View>
                </Pressable>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-6 gap-4">
                    <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                    <Text className="text-center text-sm text-gray-400">{error}</Text>
                    <Pressable onPress={onRefresh} className="rounded-xl bg-amber-400 px-6 py-3">
                        <Text className="font-semibold text-gray-900">Retry</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ListingCard
                            listing={item}
                            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}
                        />
                    )}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-16 gap-2">
                            <MaterialIcons name="storefront" size={48} color="#d1d5db" />
                            <Text className="text-base font-medium text-gray-400">No businesses listed yet</Text>
                            <Text className="text-sm text-gray-400">Be the first to add your business!</Text>
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
