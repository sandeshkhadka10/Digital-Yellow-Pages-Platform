import React, { useState } from 'react';
import {
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { Spinner } from '@/components/ui/spinner';

import { listingsApi, CreateListingPayload, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { useToast, Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';

import {
    getListingFormErrors,
    listingFormSchema,
    type ListingFormErrors,
    type ListingFormValues,
} from '../../lib/listing-validation';

export default function AddListingScreen() {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
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

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(tabs)');
    };

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
            toast.show({
                placement: 'top',
                duration: 3000,
                render: ({ id }) => (
                    <Toast nativeID={id} action="success">
                        <ToastTitle>Listing Created!</ToastTitle>
                        <ToastDescription>Your business has been successfully added to the directory.</ToastDescription>
                    </Toast>
                ),
            });
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
            router.replace('/(tabs)');
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
                <Box className="px-4 pb-2 pt-2">
                    <Pressable onPress={handleBack} className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <MaterialIcons name="arrow-back" size={20} color="#1f2937" />
                    </Pressable>
                </Box>
                <Box className="flex-1 items-center justify-center px-6">
                    <Box className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                        <MaterialIcons name="lock-outline" size={36} color="#f59e0b" />
                    </Box>
                    <Text className="text-center text-2xl font-bold text-gray-900">Sign in required</Text>
                    <Text className="mt-3 text-center text-base text-gray-500">
                        You need to be logged in to add your business to the directory.
                    </Text>
                    <Box className="mt-8 w-full gap-3">
                        <Button onPress={() => router.push('/(auth)/login')} className="w-full rounded-xl bg-amber-400 data-[active=true]:bg-amber-500">
                            <ButtonText className="font-semibold text-base text-gray-900">Sign In</ButtonText>
                        </Button>
                        <Button variant="outline" onPress={() => router.push('/(auth)/sign-up')} className="w-full rounded-xl border-2 border-amber-400 data-[active=true]:bg-amber-50">
                            <ButtonText className="font-semibold text-base text-amber-500">Create Account</ButtonText>
                        </Button>
                    </Box>
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
                            <Text className="text-xl font-bold text-gray-900">Add Business</Text>
                            <Text className="mt-1 text-sm text-gray-500">Fill in your business details to list in the directory.</Text>
                        </Box>
                    </Box>
                </Box>
                <Box className="gap-4 px-4 pt-5">
                    {errors.general ? (
                        <Box className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <Text className="text-sm text-red-600">{errors.general}</Text>
                        </Box>
                    ) : null}
                    <Box>
                        <Text className="mb-1.5 text-sm font-medium text-gray-700">Business Title *</Text>
                        <Input variant="outline" isInvalid={!!errors.business_title} className="rounded-xl border-gray-300 bg-white data-[invalid=true]:border-red-400 data-[invalid=true]:bg-red-50">
                            <InputField value={form.business_title} onChangeText={setField('business_title')} placeholder="e.g. Kathmandu Plumbers" maxLength={100} returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                        </Input>
                        {errors.business_title ? <Text className="mt-1 text-xs text-red-500">{errors.business_title}</Text> : null}
                    </Box>
                    <Box>
                        <Box>
                            <Text className="mb-1.5 text-sm font-medium text-gray-700">Service Description *</Text>
                            <Input variant="outline" isInvalid={!!errors.service_detail} className="rounded-xl border-gray-300 bg-white data-[invalid=true]:border-red-400 data-[invalid=true]:bg-red-50">
                                <InputField value={form.service_detail} onChangeText={setField('service_detail')} placeholder="Describe your services, specialties and offerings..." multiline numberOfLines={5} maxLength={2000} textAlignVertical="top" style={{ minHeight: 100 }} placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                            </Input>
                            {errors.service_detail ? <Text className="mt-1 text-xs text-red-500">{errors.service_detail}</Text> : null}
                        </Box>
                        <Text className="mt-1 text-right text-xs text-gray-400">{form.service_detail.length}/2000</Text>
                    </Box>
                    <Box>
                        <Text className="mb-1.5 text-sm font-medium text-gray-700">Phone Number *</Text>
                        <Input variant="outline" isInvalid={!!errors.phone_number} className="rounded-xl border-gray-300 bg-white data-[invalid=true]:border-red-400 data-[invalid=true]:bg-red-50">
                            <InputField value={form.phone_number} onChangeText={setField('phone_number')} placeholder="+977XXXXXXXXX" keyboardType="phone-pad" returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                        </Input>
                        {errors.phone_number ? <Text className="mt-1 text-xs text-red-500">{errors.phone_number}</Text> : <Text className="mt-1 text-xs text-gray-400">International format with country code, e.g. +977-9841000000</Text>}
                    </Box>
                    <Box>
                        <Text className="mb-1.5 text-sm font-medium text-gray-700">Business Email *</Text>
                        <Input variant="outline" isInvalid={!!errors.business_email} className="rounded-xl border-gray-300 bg-white data-[invalid=true]:border-red-400 data-[invalid=true]:bg-red-50">
                            <InputField value={form.business_email} onChangeText={setField('business_email')} placeholder="info@yourbusiness.com" keyboardType="email-address" autoCapitalize="none" returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                        </Input>
                        {errors.business_email ? <Text className="mt-1 text-xs text-red-500">{errors.business_email}</Text> : null}
                    </Box>
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
                            <Box>
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">City</Text>
                                <Input variant="outline" className="rounded-xl border-gray-300 bg-white">
                                    <InputField value={form.city} onChangeText={setField('city')} placeholder="e.g. Kathmandu" returnKeyType="next" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                                </Input>
                            </Box>
                            <Box>
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">Region / Province</Text>
                                <Input variant="outline" className="rounded-xl border-gray-300 bg-white">
                                    <InputField value={form.region} onChangeText={setField('region')} placeholder="e.g. Bagmati" returnKeyType="done" placeholderTextColor="#9ca3af" className="text-sm text-gray-900" />
                                </Input>
                            </Box>
                        </Box>
                        <Text className="mt-2 text-xs text-gray-400">Adding city and region helps customers find you in text-based searches.</Text>
                    </Box>
                    <Button onPress={handleSubmit} isDisabled={isSubmitting} className="w-full rounded-xl bg-amber-400 data-[active=true]:bg-amber-500 data-[disabled=true]:opacity-50">
                        {isSubmitting && <ButtonSpinner color="#1f2937" />}
                        <ButtonText className="font-semibold text-base text-gray-900">Publish Listing</ButtonText>
                    </Button>
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
}
