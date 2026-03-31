import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Type-safe Result pattern for server actions */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function err<T>(error: string): ActionResult<T> {
  return { success: false, error }
}

/** Generate a sequential invoice/receipt number */
export function generateNumber(prefix: string, sequence: number, year?: string): string {
  const yr = year ?? new Date().getFullYear().toString()
  return `${prefix}-${yr}-${String(sequence).padStart(5, '0')}`
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/** Sleep utility for dev/testing */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
