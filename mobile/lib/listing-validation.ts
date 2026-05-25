import { z } from 'zod';

export const ALLOWED_MAP_HOSTS = [
    'maps.google.com',
    'www.google.com',
    'goo.gl',
    'maps.apple.com',
    'www.openstreetmap.org',
    'osm.org',
];

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
    location_url: z
        .string()
        .trim()
        .min(1, 'Location URL is required.')
        .superRefine((value, ctx) => {
            try {
                const url = new URL(value);
                if (url.protocol !== 'https:') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Location URL must use HTTPS.',
                    });
                    return;
                }

                const hostname = url.hostname.toLowerCase();
                if (!ALLOWED_MAP_HOSTS.some(allowed => hostname.endsWith(allowed))) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Use a Google Maps, Apple Maps, or OpenStreetMap link.',
                    });
                }
            } catch {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Enter a valid location URL.',
                });
            }
        }),
    city: z.string().trim(),
    region: z.string().trim(),
});

export type ListingFormValues = z.infer<typeof listingFormSchema>;

export interface ListingFormErrors {
    business_title?: string;
    service_detail?: string;
    phone_number?: string;
    business_email?: string;
    location_url?: string;
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
        location_url: fieldErrors.location_url?.[0],
        city: fieldErrors.city?.[0],
        region: fieldErrors.region?.[0],
        general: undefined,
    };
}
