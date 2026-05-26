import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';

import { listingsApi, CreateListingPayload, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { AppInput } from '@/components/ui/app-input';
import { AppButton } from '@/components/ui/app-button';

import {
    getListingFormErrors,
    listingFormSchema,
    type ListingFormErrors,
    type ListingFormValues,
} from '../../lib/listing-validation';

export default function AddListingScreen() {
    const { isAuthenticated } = useAuth();
    const [form, setForm] = useState<ListingFormValues>({
        business_title: '',
        service_detail: '',
        phone_number: '',
        business_email: '',
        city: '',
        region: '',
    });
    const [errors, setErrors] = useState<ListingFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [gpsLabel, setGpsLabel] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const setField = (field: keyof ListingFormValues) => (value: string) => {
        setForm((prev: ListingFormValues) => ({ ...prev, [field]: value }));
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

    const handleSubmit = async () => {
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
            await listingsApi.createListing(payload);
            Alert.alert(
                'Listing Created!',
                'Your business has been successfully added to the directory.',
                [{
                    text: 'View Listings',
                    onPress: () => {
                        setForm({
                            business_title: '',
                            service_detail: '',
                            phone_number: '',
                            business_email: '',
                            city: '',
                            region: '',
                        });
                        setGpsCoords(null);
                        setGpsLabel('');
                        router.replace('/(tabs)' as never);
                    },
                }],
            );
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors({ general: err.message });
            } else {
                setErrors({ general: 'Something went wrong. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 items-center justify-center px-6">
                    <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                        <MaterialIcons name="lock-outline" size={36} color="#f59e0b" />
                    </View>
                    <Text className="text-center text-2xl font-bold text-gray-900">Sign in required</Text>
                    <Text className="mt-3 text-center text-base text-gray-500">
                        You need to be logged in to add your business to the directory.
                    </Text>
                    <View className="mt-8 w-full gap-3">
                        <AppButton title="Sign In" fullWidth onPress={() => router.push('/(auth)/login' as never)} />
                        <AppButton title="Create Account" variant="outline" fullWidth onPress={() => router.push('/(auth)/sign-up' as never)} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="border-b border-gray-100 px-4 pb-4 pt-4">
                    <Text className="text-xl font-bold text-gray-900">Add Business</Text>
                    <Text className="mt-1 text-sm text-gray-500">Fill in your business details to list in the directory.</Text>
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
                    <View className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <Text className="mb-1.5 text-sm font-semibold text-gray-800">Business Location Pin *</Text>
                        <Text className="mb-3 text-xs text-gray-500">Required — used to show your business in radius searches.</Text>
                        {gpsCoords ? (
                            <View className="flex-row items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                                <View className="flex-row items-center gap-2">
                                    <MaterialIcons name="location-on" size={16} color="#16a34a" />
                                    <Text className="text-xs text-green-700">{gpsLabel}</Text>
                                </View>
                                <Pressable onPress={() => { setGpsCoords(null); setGpsLabel(''); }}>
                                    <Text className="text-xs text-red-400">Remove</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable
                                onPress={handleGetLocation}
                                disabled={isGettingLocation}
                                className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-amber-300 bg-white py-3 active:bg-amber-100"
                            >
                                {isGettingLocation ? (
                                    <ActivityIndicator size="small" color="#f59e0b" />
                                ) : (
                                    <MaterialIcons name="my-location" size={16} color="#d97706" />
                                )}
                                <Text className="text-sm font-medium text-amber-700">
                                    {isGettingLocation ? 'Getting location...' : 'Pin my current location'}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                    <View className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Location (Optional)</Text>
                        <View className="gap-3">
                            <AppInput label="City" value={form.city} onChangeText={setField('city')} placeholder="e.g. Kathmandu" returnKeyType="next" />
                            <AppInput label="Region / Province" value={form.region} onChangeText={setField('region')} placeholder="e.g. Bagmati" returnKeyType="done" />
                        </View>
                        <Text className="mt-2 text-xs text-gray-400">Adding city and region helps customers find you in text-based searches.</Text>
                    </View>
                    <AppButton title="Publish Listing" fullWidth isLoading={isSubmitting} onPress={handleSubmit} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
