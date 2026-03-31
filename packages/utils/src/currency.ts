/**
 * Indian currency helpers.
 * All money is stored as PAISE (integer). 1 INR = 100 paise.
 */

export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100)
}

export function formatCurrencyDecimal(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100)
}

export function paiseToCurrency(paise: number): number {
  return paise / 100
}

export function currencyToPaise(amount: number): number {
  return Math.round(amount * 100)
}

export function formatCompactCurrency(paise: number): string {
  const inr = paise / 100
  if (inr >= 10000000) return `₹${(inr / 10000000).toFixed(1)}Cr`
  if (inr >= 100000) return `₹${(inr / 100000).toFixed(1)}L`
  if (inr >= 1000) return `₹${(inr / 1000).toFixed(1)}K`
  return formatCurrency(paise)
}

/** GST split for Karnataka (state code 29) */
export function calculateGST(
  amountPaise: number,
  gstRate: number,
  isSameState: boolean
): { cgst: number; sgst: number; igst: number; total: number } {
  const gstAmount = Math.round(amountPaise * gstRate)
  if (isSameState) {
    const half = Math.round(gstAmount / 2)
    return { cgst: half, sgst: gstAmount - half, igst: 0, total: amountPaise + gstAmount }
  }
  return { cgst: 0, sgst: 0, igst: gstAmount, total: amountPaise + gstAmount }
}
