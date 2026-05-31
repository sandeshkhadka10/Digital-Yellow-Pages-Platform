import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';

import { ApiError, BusinessListing, CreateListingPayload, listingsApi } from '@/lib/api';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { FormInput } from '@/components/FormInput';
import { useAuth } from '@/context/auth-context';

import {
    getListingFormErrors,
    listingFormSchema,
    type ListingFormErrors,
    type ListingFormValues,
} from '../../../lib/listing-validation';
import { ServiceDescriptionInput } from '@/components/ServiceDescriptionInput';

function toFormState(listing: BusinessListing): ListingFormValues {
    return {
        business_title: listing.business_title,
        service_detail: listing.service_detail,
        phone_number: listing.phone_number,
        business_email: listing.business_email,
        city: listing.city ?? '',
        region: listing.region ?? '',
    };
}

export default function EditListingScreen() {
    const { user, isAuthenticated } = useAuth();
    const toast = useToast();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const listingId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [listing, setListing] = useState<BusinessListing | null>(null);
    const [form, setForm] = useState<ListingFormValues | null>(null);
    const [errors, setErrors] = useState<ListingFormErrors>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [gpsLabel, setGpsLabel] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        if (listingId) {
            router.replace({ pathname: '/listing/[id]', params: { id: listingId } });
            return;
        }
        router.replace('/(tabs)');
    };

    const isOwner = useMemo(() => {
        if (!user?.email || !listing?.owner_email) return false;
        return user.email.toLowerCase() === listing.owner_email.toLowerCase();
    }, [user?.email, listing?.owner_email]);

    useEffect(() => {
        if (!listingId) {
            setErrors({ general: 'Listing ID is missing.' });
            setIsLoading(false);
            return;
        }
        const currentListingId = listingId;

        let isMounted = true;

        async function loadListing() {
            try {
                const data = await listingsApi.getListing(currentListingId);
                if (!isMounted) return;
                setListing(data);
                setForm(toFormState(data));
            } catch (err) {
                if (!isMounted) return;
                if (err instanceof ApiError) setErrors({ general: err.message });
                else setErrors({ general: 'Failed to load listing.' });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadListing();

        return () => {
            isMounted = false;
        };
    }, [listingId]);

    useEffect(() => {
        if (listing?.latitude != null && listing?.longitude != null) {
            setGpsCoords({ latitude: listing.latitude, longitude: listing.longitude });
            setGpsLabel(`${listing.latitude.toFixed(5)}, ${listing.longitude.toFixed(5)}`);
        }
    }, [listing]);

    const setField = (field: keyof ListingFormValues) => (value: string) => {
        setForm((prev: ListingFormValues | null) => (prev ? { ...prev, [field]: value } : prev));
        setErrors((prev: ListingFormErrors) => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const handleGetLocation = async () => {
        setIsGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrors(prev => ({ ...prev, general: 'Location permission denied.' }));
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setGpsCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setGpsLabel(place ? [place.city, place.region].filter(Boolean).join(', ') : `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
        } catch {
            setErrors(prev => ({ ...prev, general: 'Could not get your location. Please try again.' }));
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleUpdate = async () => {
        if (!listingId || !form) return;

        const parsed = listingFormSchema.safeParse(form);
        if (!parsed.success) {
            setErrors(getListingFormErrors(parsed.error));
            return;
        }
        if (!gpsCoords) {
            setErrors(prev => ({ ...prev, general: 'Business location pin is required. Please pin your current location.' }));
            return;
        }

        setIsSubmitting(true);
        try {
            const values = parsed.data;
            const payload: CreateListingPayload = {
                business_title: values.business_title,
                service_detail: values.service_detail,
                phone_number: values.phone_number,
                business_email: values.business_email,
                latitude: gpsCoords?.latitude,
                longitude: gpsCoords?.longitude,
                city: values.city || undefined,
                region: values.region || undefined,
            };
            await listingsApi.updateListing(listingId, payload);
            toast.show({
                placement: 'top',
                duration: 3000,
                render: ({ id }) => (
                    <Toast nativeID={id} action="success">
                        <ToastTitle>Listing updated</ToastTitle>
                        <ToastDescription>Your changes were saved.</ToastDescription>
                    </Toast>
                ),
            });
            router.replace({ pathname: '/listing/[id]', params: { id: listingId } });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : 'Unable to update listing.';
            setErrors({ general: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Box className="px-4 pb-2 pt-2">
                    <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                    </Pressable>
                </Box>
                <Box className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-2xl font-bold text-gray-900">Sign in required</Text>
                    <Text className="text-center text-base text-gray-500">You must be logged in to edit a listing.</Text>
                    <Button onPress={() => router.replace('/(auth)/login')} className="rounded-xl bg-amber-400 data-[active=true]:bg-amber-500">
                        <ButtonText className="font-semibold text-base text-gray-900">Sign In</ButtonText>
                    </Button>
                </Box>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Box className="flex-1 items-center justify-center">
                    <Spinner size="large" color="#f59e0b" />
                </Box>
            </SafeAreaView>
        );
    }

    if (!listing || !form) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Box className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-base text-red-500">{errors.general ?? 'Listing not found.'}</Text>
                    <Button onPress={() => router.back()} className="rounded-xl bg-amber-400 data-[active=true]:bg-amber-500">
                        <ButtonText className="font-semibold text-base text-gray-900">Go Back</ButtonText>
                    </Button>
                </Box>
            </SafeAreaView>
        );
    }

    if (!isOwner) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Box className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-2xl font-bold text-gray-900">Access denied</Text>
                    <Text className="text-center text-base text-gray-500">Only the listing owner can edit this listing.</Text>
                    <Button onPress={() => router.replace({ pathname: '/listing/[id]', params: { id: listing.id } })} className="rounded-xl bg-amber-400 data-[active=true]:bg-amber-500">
                        <ButtonText className="font-semibold text-base text-gray-900">Back to listing</ButtonText>
                    </Button>
                </Box>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Box className="border-b border-gray-100 px-4 pb-4 pt-4">
                    <Box className="flex-row items-center gap-3">
                        <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                            <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                        </Pressable>
                        <Box className="flex-1">
                            <Text className="text-xl font-bold text-gray-900">Edit Business</Text>
                            <Text className="mt-1 text-sm text-gray-500">Update your business details.</Text>
                        </Box>
                    </Box>
                </Box>
                <Box className="gap-4 px-4 pt-5">
                    {errors.general ? (
                        <Box className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <Text className="text-sm text-red-600">{errors.general}</Text>
                        </Box>
                    ) : null}
                    <FormInput
                        label="Business Title *"
                        value={form.business_title}
                        onChangeText={setField('business_title')}
                        placeholder="e.g. Kathmandu Plumbers"
                        maxLength={100}
                        returnKeyType="next"
                        error={errors.business_title}
                    />
                    <ServiceDescriptionInput
                        value={form.service_detail}
                        onChangeText={setField('service_detail')}
                        error={errors.service_detail}
                    />
                    <FormInput
                        label="Phone Number *"
                        value={form.phone_number}
                        onChangeText={setField('phone_number')}
                        placeholder="+977XXXXXXXXX"
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        error={errors.phone_number}
                        hint="International format with country code, e.g. +977-9841000000"
                    />
                    <FormInput
                        label="Business Email *"
                        value={form.business_email}
                        onChangeText={setField('business_email')}
                        placeholder="info@yourbusiness.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        error={errors.business_email}
                    />
                    <Box className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <Text className="mb-1.5 text-sm font-semibold text-gray-800">Business Location Pin *</Text>
                        <Text className="mb-3 text-xs text-gray-500">Required — used to show your business in radius searches.</Text>
                        {gpsCoords ? (
                            <Box className="flex-row items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                                <Box className="flex-row items-center gap-2">
                                    <MaterialIcons name="location-on" size={16} color="#16a34a" />
                                    <Text className="text-xs text-green-700">{gpsLabel}</Text>
                                </Box>
                                <Pressable onPress={() => { setGpsCoords(null); setGpsLabel(''); }}>
                                    <Text className="text-xs text-red-400">Remove</Text>
                                </Pressable>
                            </Box>
                        ) : (
                            <Pressable
                                onPress={handleGetLocation}
                                disabled={isGettingLocation}
                                className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-white py-3 active:bg-amber-100"
                            >
                                {isGettingLocation ? (
                                    <Spinner size="small" color="#f59e0b" />
                                ) : (
                                    <MaterialIcons name="my-location" size={16} color="#d97706" />
                                )}
                                <Text className="text-sm font-medium text-amber-700">
                                    {isGettingLocation ? 'Getting location...' : 'Pin my current location'}
                                </Text>
                            </Pressable>
                        )}
                    </Box>
                    <Box className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Location (Optional)</Text>
                        <Box className="gap-3">
                            <FormInput
                                label="City"
                                value={form.city}
                                onChangeText={setField('city')}
                                placeholder="e.g. Kathmandu"
                                returnKeyType="next"
                            />
                            <FormInput
                                label="Region / Province"
                                value={form.region}
                                onChangeText={setField('region')}
                                placeholder="e.g. Bagmati"
                                returnKeyType="done"
                            />
                        </Box>
                    </Box>
                    <Box className="gap-3">
                        <Button variant="outline" onPress={() => router.back()} className="w-full rounded-xl border-2 border-amber-400 data-[active=true]:bg-amber-50">
                            <ButtonText className="font-semibold text-base text-amber-500">Cancel</ButtonText>
                        </Button>
                        <Button onPress={handleUpdate} isDisabled={isSubmitting} className="w-full rounded-xl bg-amber-400 data-[active=true]:bg-amber-500 data-[disabled=true]:opacity-50">
                            {isSubmitting && <ButtonSpinner color="#1f2937" />}
                            <ButtonText className="font-semibold text-base text-gray-900">Save Changes</ButtonText>
                        </Button>
                    </Box>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
