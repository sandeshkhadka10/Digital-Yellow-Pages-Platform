import { z } from 'zod';

export const authEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Please enter your email address.')
        .email('Please enter a valid email address.')
        .transform((value) => value.toLowerCase()),
});
