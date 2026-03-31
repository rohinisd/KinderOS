import { z } from 'zod'

export const indianPhoneSchema = z
  .string()
  .regex(/^(\+91|91)?[6-9]\d{9}$/, 'Invalid Indian phone number')

export const paiseAmountSchema = z
  .number()
  .int('Amount must be in whole paise')
  .nonnegative('Amount cannot be negative')

export const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Format: 2025-26')

export const gstinSchema = z
  .string()
  .regex(
    /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}Z[A-Z\d]{1}$/,
    'Invalid GSTIN format'
  )
  .optional()

export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers, and hyphens only')

export const emailSchema = z.string().email('Invalid email address')

export const nameSchema = z.string().min(1, 'Required').max(100)

export const pincodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Must be 6 digits')
  .optional()
