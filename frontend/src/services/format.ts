const CURRENCY = 'BDT';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPercent(regularPrice: number, discountPrice?: number | null): number | null {
  if (!discountPrice || discountPrice >= regularPrice || regularPrice <= 0) return null;
  return Math.round(((regularPrice - discountPrice) / regularPrice) * 100);
}
