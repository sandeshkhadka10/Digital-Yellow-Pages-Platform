import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ApiError, BusinessListing, CreateListingPayload, listingsApi } from '@/lib/api';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { useAuth } from '@/context/auth-context';
import { extractCoordinatesFromMapUrl } from '@/lib/map-url';

import {
    getListingFormErrors,
    listingFormSchema,
    type ListingFormErrors,
    type ListingFormValues,
} from '../../../lib/listing-validation';

function toFormState(listing: BusinessListing): ListingFormValues {
    return {
        business_title: listing.business_title,
        service_detail: listing.service_detail,
        phone_number: listing.phone_number,
        business_email: listing.business_email,
        location_url: listing.location_url,
        city: listing.city ?? '',
        region: listing.region ?? '',
    };
}

export default function EditListingScreen() {
    const { user, isAuthenticated } = useAuth();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const listingId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [listing, setListing] = useState<BusinessListing | null>(null);
    const [form, setForm] = useState<ListingFormValues | null>(null);
    const [errors, setErrors] = useState<ListingFormErrors>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const setField = (field: keyof ListingFormValues) => (value: string) => {
        setForm((prev: ListingFormValues | null) => (prev ? { ...prev, [field]: value } : prev));
        setErrors((prev: ListingFormErrors) => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const handleUpdate = async () => {
        if (!listingId || !form) return;

        const parsed = listingFormSchema.safeParse(form);
        if (!parsed.success) {
            setErrors(getListingFormErrors(parsed.error));
            return;
        }

        setIsSubmitting(true);
        try {
            const values = parsed.data;
            const normalizedLocationUrl = values.location_url;
            const coordinates = extractCoordinatesFromMapUrl(normalizedLocationUrl);
            const payload: CreateListingPayload = {
                business_title: values.business_title,
                service_detail: values.service_detail,
                phone_number: values.phone_number,
                business_email: values.business_email,
                location_url: normalizedLocationUrl,
                latitude: coordinates?.latitude,
                longitude: coordinates?.longitude,
                city: values.city || undefined,
                region: values.region || undefined,
            };
            await listingsApi.updateListing(listingId, payload);
            Alert.alert('Listing updated', 'Your changes were saved.', [
                { text: 'View listing', onPress: () => router.replace({ pathname: '/listing/[id]', params: { id: listingId } }) },
            ]);
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
                <View className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-2xl font-bold text-gray-900">Sign in required</Text>
                    <Text className="text-center text-base text-gray-500">You must be logged in to edit a listing.</Text>
                    <AppButton title="Sign In" onPress={() => router.replace('/(auth)/login' as never)} />
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f59e0b" />
                </View>
            </SafeAreaView>
        );
    }

    if (!listing || !form) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-base text-red-500">{errors.general ?? 'Listing not found.'}</Text>
                    <AppButton title="Go Back" onPress={() => router.back()} />
                </View>
            </SafeAreaView>
        );
    }

    if (!isOwner) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center px-6 gap-4">
                    <Text className="text-center text-2xl font-bold text-gray-900">Access denied</Text>
                    <Text className="text-center text-base text-gray-500">Only the listing owner can edit this listing.</Text>
                    <AppButton title="Back to listing" onPress={() => router.replace({ pathname: '/listing/[id]', params: { id: listing.id } })} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="border-b border-gray-100 px-4 pb-4 pt-4">
                    <Text className="text-xl font-bold text-gray-900">Edit Business</Text>
                    <Text className="mt-1 text-sm text-gray-500">Update your business details.</Text>
                </View>
                <View className="gap-4 px-4 pt-5">
                    {errors.general ? (
                        <View className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <Text className="text-sm text-red-600">{errors.general}</Text>
                        </View>
                    ) : null}
                    <AppInput label="Business Title *" value={form.business_title} onChangeText={setField('business_title')} placeholder="e.g. Kathmandu Plumbers" error={errors.business_title} maxLength={100} returnKeyType="next" />
                    <View>
                        <AppInput label="Service Description *" value={form.service_detail} onChangeText={setField('service_detail')} placeholder="Describe your services, specialties and offerings..." multiline numberOfLines={5} maxLength={2000} textAlignVertical="top" style={{ minHeight: 100 }} error={errors.service_detail} />
                        <Text className="mt-1 text-right text-xs text-gray-400">{form.service_detail.length}/2000</Text>
                    </View>
                    <AppInput label="Phone Number *" value={form.phone_number} onChangeText={setField('phone_number')} placeholder="+977XXXXXXXXX" keyboardType="phone-pad" error={errors.phone_number} hint="International format with country code, e.g. +977-9841000000" returnKeyType="next" />
                    <AppInput label="Business Email *" value={form.business_email} onChangeText={setField('business_email')} placeholder="info@yourbusiness.com" keyboardType="email-address" autoCapitalize="none" error={errors.business_email} returnKeyType="next" />
                    <AppInput label="Location URL *" value={form.location_url} onChangeText={setField('location_url')} placeholder="https://maps.google.com/?q=..." keyboardType="url" autoCapitalize="none" error={errors.location_url} hint="Google Maps, Apple Maps, or OpenStreetMap HTTPS link" returnKeyType="next" />
                    <View className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Location (Optional)</Text>
                        <View className="gap-3">
                            <AppInput label="City" value={form.city} onChangeText={setField('city')} placeholder="e.g. Kathmandu" returnKeyType="next" />
                            <AppInput label="Region / Province" value={form.region} onChangeText={setField('region')} placeholder="e.g. Bagmati" returnKeyType="done" />
                        </View>
                    </View>
                    <View className="gap-3">
                        <AppButton title="Cancel" variant="outline" fullWidth onPress={() => router.back()} />
                        <AppButton title="Save Changes" fullWidth isLoading={isSubmitting} onPress={handleUpdate} />
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
