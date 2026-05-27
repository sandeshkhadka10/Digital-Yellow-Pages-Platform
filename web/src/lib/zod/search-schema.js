import { z } from 'zod';

export const radiusKmSchema = z.preprocess(
    (value) => {
        if (typeof value === 'string' && value.trim() === '') return NaN;
        if (typeof value === 'string' || typeof value === 'number') {
            return Number(value);
        }
        return value;
    },
    z
        .number({ invalid_type_error: 'Radius must be a number.' })
        .finite('Radius must be a valid number.')
        .nonnegative('Radius cannot be negative.'),
);

export const searchParamsSchema = z.object({
    page: z.number().int().positive(),
    q: z.string().min(1, 'Search term cannot be empty.').optional(),
    city: z.string().min(1, 'City cannot be empty.').optional(),
    region: z.string().min(1, 'Region cannot be empty.').optional(),
    lat: z.number().finite().optional(),
    lng: z.number().finite().optional(),
    radius_km: radiusKmSchema.optional(),
});
