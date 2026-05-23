import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { listingsApi, CreateListingPayload, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { AppInput } from '@/components/ui/app-input';
import { AppButton } from '@/components/ui/app-button';

interface FormState {
    business_title: string;
    service_detail: string;
    phone_number: string;
    business_email: string;
    location_url: string;
    city: string;
    region: string;
}

interface FormErrors {
    business_title?: string;
    service_detail?: string;
    phone_number?: string;
    business_email?: string;
    location_url?: string;
    city?: string;
    region?: string;
    general?: string;
}

const INITIAL_FORM: FormState = {
    business_title: '',
    service_detail: '',
    phone_number: '',
    business_email: '',
    location_url: '',
    city: '',
    region: '',
};

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.business_title.trim()) errors.business_title = 'Business title is required.';
    else if (form.business_title.trim().length < 3) errors.business_title = 'Must be at least 3 characters.';
    if (!form.service_detail.trim()) errors.service_detail = 'Service description is required.';
    else if (form.service_detail.trim().length < 20) errors.service_detail = 'Must be at least 20 characters.';
    if (!form.phone_number.trim()) errors.phone_number = 'Phone number is required.';
    else if (!/^\+?[\d\s\-]{7,20}$/.test(form.phone_number.trim())) errors.phone_number = 'Enter a valid phone number.';
    if (!form.business_email.trim()) errors.business_email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.business_email.trim())) errors.business_email = 'Enter a valid email address.';
    if (!form.location_url.trim()) errors.location_url = 'Location URL is required.';
    else if (!/^https?:\/\/.+/.test(form.location_url.trim())) errors.location_url = 'Must be a valid HTTPS URL.';
    return errors;
}

export default function AddListingScreen() {
    const { isAuthenticated } = useAuth();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const setField = (field: keyof FormState) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async () => {
        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);
        try {
            const payload: CreateListingPayload = {
                business_title: form.business_title.trim(),
                service_detail: form.service_detail.trim(),
                phone_number: form.phone_number.trim(),
                business_email: form.business_email.trim(),
                location_url: form.location_url.trim(),
                city: form.city.trim() || undefined,
                region: form.region.trim() || undefined,
            };
            await listingsApi.createListing(payload);
            Alert.alert(
                'Listing Created!',
                'Your business has been successfully added to the directory.',
                [{ text: 'View Listings', onPress: () => { setForm(INITIAL_FORM); router.replace('/(tabs)' as never); } }],
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
                    <AppInput label="Location URL *" value={form.location_url} onChangeText={setField('location_url')} placeholder="https://maps.google.com/?q=..." keyboardType="url" autoCapitalize="none" error={errors.location_url} hint="Google Maps, Apple Maps, or OpenStreetMap HTTPS link" returnKeyType="next" />
                    <View className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Location (Optional)</Text>
                        <View className="gap-3">
                            <AppInput label="City" value={form.city} onChangeText={setField('city')} placeholder="e.g. Kathmandu" returnKeyType="next" />
                            <AppInput label="Region / Province" value={form.region} onChangeText={setField('region')} placeholder="e.g. Bagmati" returnKeyType="done" />
                        </View>
                        <Text className="mt-2 text-xs text-gray-400">Adding city and region helps customers find you in location-based searches.</Text>
                    </View>
                    <AppButton title="Publish Listing" fullWidth isLoading={isSubmitting} onPress={handleSubmit} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
