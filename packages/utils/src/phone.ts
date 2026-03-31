/**
 * Indian phone number helpers.
 * Always store with +91 prefix. Validate 10-digit Indian numbers.
 */

const INDIA_PHONE_REGEX = /^[6-9]\d{9}$/

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+91${digits}`
  }
  if (digits.length === 13 && digits.startsWith('091')) {
    return `+91${digits.slice(3)}`
  }
  return `+91${digits}`
}

export function validateIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  const tenDigit = digits.length === 12 && digits.startsWith('91')
    ? digits.slice(2)
    : digits.length === 10
    ? digits
    : null
  return tenDigit !== null && INDIA_PHONE_REGEX.test(tenDigit)
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone)
  const digits = normalized.replace('+91', '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return normalized
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizePhone(phone).replace('+', '')
  const url = `https://wa.me/${normalized}`
  return message ? `${url}?text=${encodeURIComponent(message)}` : url
}
