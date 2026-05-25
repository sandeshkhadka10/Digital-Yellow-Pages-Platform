import { z } from 'zod';

export const searchRadiusKmSchema = z.coerce
    .number({ error: 'Radius must be a number.' })
    .finite('Radius must be a valid number.')
    .positive('Radius must be greater than 0.');