import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ApiError, BusinessListing, listingsApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function ListingDetailScreen() {
    const { user, isAuthenticated } = useAuth();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const listingId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [listing, setListing] = useState<BusinessListing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const isOwner =
        isAuthenticated &&
        !!user?.email &&
        !!listing?.owner_email &&
        user.email.toLowerCase() === listing.owner_email.toLowerCase();

    useEffect(() => {
        if (!listingId) {
            setError('Listing ID is missing.');
            setIsLoading(false);
            return;
        }

        const currentListingId: string = listingId;

        let isMounted = true;

        async function loadListing() {
            try {
                const data = await listingsApi.getListing(currentListingId);
                if (isMounted) setListing(data);
            } catch (err) {
                if (!isMounted) return;
                if (err instanceof ApiError && err.status === 404) {
                    setError('This listing could not be found.');
                } else {
                    setError('Failed to load listing details.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadListing();

        return () => {
            isMounted = false;
        };
    }, [listingId]);

    const openMap = async () => {
        if (!listing) return;
        await Linking.openURL(listing.location_url);
    };

    const callBusiness = async () => {
        if (!listing) return;
        await Linking.openURL(`tel:${listing.phone_number}`);
    };

    const emailBusiness = async () => {
        if (!listing) return;
        await Linking.openURL(`mailto:${listing.business_email}`);
    };

    const handleDelete = () => {
        if (!listing || isDeleting) return;

        Alert.alert(
            'Delete listing?'
            , 'This will remove your listing from public results.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await listingsApi.deleteListing(listing.id);
                            Alert.alert('Listing deleted', 'Your listing has been removed.', [
                                { text: 'OK', onPress: () => router.replace('/(tabs)' as never) },
                            ]);
                        } catch (err) {
                            const message = err instanceof ApiError ? err.message : 'Unable to delete listing.';
                            Alert.alert('Delete failed', message);
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                <View className="flex-row items-center gap-3">
                    <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                    </Pressable>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                            Listing details
                        </Text>
                        <Text className="text-sm text-gray-500" numberOfLines={1}>
                            View the full business information
                        </Text>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-6 gap-4">
                    <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                    <Text className="text-center text-sm text-gray-400">{error}</Text>
                    <Pressable onPress={() => router.back()} className="rounded-xl bg-amber-400 px-6 py-3">
                        <Text className="font-semibold text-gray-900">Go back</Text>
                    </Pressable>
                </View>
            ) : listing ? (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
                    <View className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                        <View className="mb-3 flex-row items-start justify-between gap-3">
                            <Text className="flex-1 text-2xl font-bold text-gray-900">{listing.business_title}</Text>
                            {listing.is_active ? (
                                <View className="rounded-full bg-green-50 px-3 py-1">
                                    <Text className="text-xs font-semibold text-green-700">Active</Text>
                                </View>
                            ) : null}
                        </View>

                        <Text className="mb-4 text-sm leading-5 text-gray-600">{listing.service_detail}</Text>

                        <View className="mb-4 gap-3 rounded-2xl bg-gray-50 p-4">
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons name="location-on" size={18} color="#f59e0b" />
                                <Text className="flex-1 text-sm text-gray-700">{[listing.city, listing.region].filter(Boolean).join(', ') || 'Location not provided'}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons name="email" size={18} color="#f59e0b" />
                                <Text className="flex-1 text-sm text-gray-700">{listing.business_email}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons name="phone" size={18} color="#f59e0b" />
                                <Text className="flex-1 text-sm text-gray-700">{listing.phone_number}</Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <MaterialIcons name="link" size={18} color="#f59e0b" />
                                <Text className="flex-1 text-sm text-gray-700" numberOfLines={2}>{listing.location_url}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <Pressable onPress={callBusiness} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-3 active:bg-amber-500">
                                <MaterialIcons name="call" size={16} color="#1f2937" />
                                <Text className="text-sm font-semibold text-gray-900">Call</Text>
                            </Pressable>
                            <Pressable onPress={emailBusiness} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 active:bg-gray-50">
                                <MaterialIcons name="mail" size={16} color="#6b7280" />
                                <Text className="text-sm font-semibold text-gray-600">Email</Text>
                            </Pressable>
                            <Pressable onPress={openMap} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 active:bg-gray-50">
                                <MaterialIcons name="map" size={16} color="#6b7280" />
                                <Text className="text-sm font-semibold text-gray-600">Map</Text>
                            </Pressable>
                        </View>

                        {isOwner ? (
                            <View className="mt-3 flex-row gap-2">
                                <Pressable
                                    onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: listing.id } })}
                                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-3 active:bg-amber-100"
                                >
                                    <MaterialIcons name="edit" size={16} color="#b45309" />
                                    <Text className="text-sm font-semibold text-amber-700">Edit</Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    disabled={isDeleting}
                                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-3 active:bg-red-100"
                                >
                                    <MaterialIcons name="delete-outline" size={16} color="#dc2626" />
                                    <Text className="text-sm font-semibold text-red-600">
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Text>
                                </Pressable>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            ) : null}
        </SafeAreaView>
    );
}