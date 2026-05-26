import { z } from 'zod';

export const listingFormSchema = z.object({
    business_title: z
        .string()
        .trim()
        .min(1, 'Business title is required.')
        .min(3, 'Must be at least 3 characters.'),
    service_detail: z
        .string()
        .trim()
        .min(1, 'Service description is required.')
        .min(20, 'Must be at least 20 characters.'),
    phone_number: z
        .string()
        .trim()
        .min(1, 'Phone number is required.')
        .regex(/^\+[\d\s\-()]{7,25}$/, 'Use international format with country code, e.g. +977XXXXXXXXX.'),
    business_email: z
        .string()
        .trim()
        .min(1, 'Email is required.')
        .email('Enter a valid email address.'),
    city: z.string().trim(),
    region: z.string().trim(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

export interface ListingFormErrors {
    business_title?: string;
    service_detail?: string;
    phone_number?: string;
    business_email?: string;
    city?: string;
    region?: string;
    general?: string;
}

export function getListingFormErrors(error: z.ZodError): ListingFormErrors {
    const fieldErrors = error.flatten().fieldErrors as Partial<Record<keyof ListingFormValues, string[]>>;

    return {
        business_title: fieldErrors.business_title?.[0],
        service_detail: fieldErrors.service_detail?.[0],
        phone_number: fieldErrors.phone_number?.[0],
        business_email: fieldErrors.business_email?.[0],
        city: fieldErrors.city?.[0],
        region: fieldErrors.region?.[0],
        general: undefined,
    };
}
