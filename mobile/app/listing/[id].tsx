import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MapView, { Marker } from 'react-native-maps';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, AlertDialogBackdrop } from '@/components/ui/alert-dialog';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const toast = useToast();

    const isOwner =
        isAuthenticated &&
        !!user?.email &&
        !!listing?.owner_email &&
        user.email.toLowerCase() === listing.owner_email.toLowerCase();

    const lat = listing?.latitude ?? null;
    const lng = listing?.longitude ?? null;
    const hasCoords = lat != null && lng != null;

    useEffect(() => {
        if (!listingId) {
            setError('Listing ID is missing.');
            setIsLoading(false);
            return;
        }

        const currentListingId = listingId;

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

    const openGoogleMaps = async () => {
        if (!hasCoords) return;
        await Linking.openURL(`https://maps.google.com/maps?q=${lat},${lng}`);
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
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!listing) return;
        try {
            setIsDeleting(true);
            setIsDeleteDialogOpen(false);
            await listingsApi.deleteListing(listing.id);
            toast.show({
                placement: 'top',
                duration: 3000,
                render: ({ id }) => (
                    <Toast nativeID={id} action="success">
                        <ToastTitle>Listing deleted</ToastTitle>
                        <ToastDescription>Your listing has been removed.</ToastDescription>
                    </Toast>
                ),
            });
            router.replace('/(tabs)');
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Unable to delete listing.';
            toast.show({
                placement: 'top',
                duration: 4000,
                render: ({ id }) => (
                    <Toast nativeID={id} action="error">
                        <ToastTitle>Delete failed</ToastTitle>
                        <ToastDescription>{message}</ToastDescription>
                    </Toast>
                ),
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <SafeAreaView className="flex-1 bg-gray-50">
                <Box className="border-b border-gray-100 bg-white px-4 pb-3 pt-4">
                    <Box className="flex-row items-center gap-3">
                        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                            <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                        </Pressable>
                        <Box className="flex-1">
                            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
                                Listing details
                            </Text>
                            <Text className="text-sm text-gray-500" numberOfLines={1}>
                                View the full business information
                            </Text>
                        </Box>
                    </Box>
                </Box>

                {isLoading ? (
                    <Box className="flex-1 items-center justify-center">
                        <Spinner size="large" color="#f59e0b" />
                    </Box>
                ) : error ? (
                    <Box className="flex-1 items-center justify-center px-6 gap-4">
                        <MaterialIcons name="error-outline" size={40} color="#d1d5db" />
                        <Text className="text-center text-sm text-gray-400">{error}</Text>
                        <Pressable onPress={() => router.back()} className="rounded-xl bg-amber-400 px-6 py-3">
                            <Text className="font-semibold text-gray-900">Go back</Text>
                        </Pressable>
                    </Box>
                ) : listing ? (
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
                        <Box className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <Box className="mb-3 flex-row items-start justify-between gap-3">
                                <Text className="flex-1 text-2xl font-bold text-gray-900">{listing.business_title}</Text>
                                <Box className="flex-row items-center gap-2">
                                    {listing.is_active ? (
                                        <Box className="rounded-full bg-green-50 px-3 py-1">
                                            <Text className="text-xs font-semibold text-green-700">Active</Text>
                                        </Box>
                                    ) : null}
                                    {isOwner ? (
                                        <>
                                            <Pressable
                                                onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: listing.id } })}
                                                className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 active:bg-amber-100"
                                            >
                                                <MaterialIcons name="edit" size={18} color="#b45309" />
                                            </Pressable>
                                            <Pressable
                                                onPress={handleDelete}
                                                disabled={isDeleting}
                                                className="h-9 w-9 items-center justify-center rounded-xl bg-red-50 active:bg-red-100"
                                            >
                                                <MaterialIcons name="delete-outline" size={18} color="#dc2626" />
                                            </Pressable>
                                        </>
                                    ) : null}
                                </Box>
                            </Box>

                            <Text className="mb-4 text-sm leading-5 text-gray-600">{listing.service_detail}</Text>

                            <Box className="mb-4 gap-3 rounded-2xl bg-gray-50 p-4">
                                <Box className="flex-row items-center gap-3">
                                    <MaterialIcons name="location-on" size={18} color="#f59e0b" />
                                    <Text className="flex-1 text-sm text-gray-700">{[listing.city, listing.region].filter(Boolean).join(', ') || 'Location not provided'}</Text>
                                </Box>
                                <Box className="flex-row items-center gap-3">
                                    <MaterialIcons name="email" size={18} color="#f59e0b" />
                                    <Text className="flex-1 text-sm text-gray-700">{listing.business_email}</Text>
                                </Box>
                                <Box className="flex-row items-center gap-3">
                                    <MaterialIcons name="phone" size={18} color="#f59e0b" />
                                    <Text className="flex-1 text-sm text-gray-700">{listing.phone_number}</Text>
                                </Box>
                            </Box>

                            {hasCoords ? (
                                <View className="mb-6">
                                    <Text className="mb-3 text-sm font-semibold text-gray-700">Location</Text>
                                    <View className="overflow-hidden rounded-xl border border-gray-200">
                                        <MapView
                                            style={{ height: 200 }}
                                            region={{
                                                latitude: lat,
                                                longitude: lng,
                                                latitudeDelta: 0.005,
                                                longitudeDelta: 0.005,
                                            }}
                                            scrollEnabled={false}
                                            zoomEnabled={false}
                                        >
                                            <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor="#EAB308" />
                                        </MapView>
                                    </View>
                                    <TouchableOpacity
                                        onPress={openGoogleMaps}
                                        className="mt-3 flex-row items-center justify-center gap-4 rounded-xl border border-yellow-200 bg-yellow-50 py-3"
                                    >
                                        <FontAwesome5 name="route" size={24} color="#a16207" />
                                        <Text className="text-sm font-semibold text-yellow-700">Open in Google Maps</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            <Box className="flex-row gap-2">
                                <Pressable onPress={callBusiness} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-3 active:bg-amber-500">
                                    <MaterialIcons name="call" size={16} color="#1f2937" />
                                    <Text className="text-sm font-semibold text-gray-900">Call</Text>
                                </Pressable>
                                <Pressable onPress={emailBusiness} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-3 active:bg-gray-50">
                                    <MaterialIcons name="mail" size={16} color="#6b7280" />
                                    <Text className="text-sm font-semibold text-gray-600">Email</Text>
                                </Pressable>
                            </Box>


                        </Box>
                    </ScrollView>
                ) : null}
            </SafeAreaView>

            <AlertDialog isOpen={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent className="bg-white opacity-80 border-0" >
                    <AlertDialogHeader>
                        <Text className="text-lg font-semibold text-gray-900">Delete listing?</Text>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text className="text-sm text-gray-500">This will remove your listing from public results.</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button variant="outline" onPress={() => setIsDeleteDialogOpen(false)} className="mr-2">
                            <ButtonText className='text-black-500'>Cancel</ButtonText>
                        </Button>
                        <Button action="negative" onPress={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting ? <ButtonSpinner /> : <ButtonText>Delete</ButtonText>}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}