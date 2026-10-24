import { z } from 'zod';

export const emailSchema = z.string().trim().email('Enter a valid email address.');

export const strongPasswordSchema = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a number.')
  .regex(/[^A-Za-z0-9]/, 'Include a symbol.');
