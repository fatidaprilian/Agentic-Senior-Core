// Calculates final total: apply percentage discount (0..100) to non-negative price,
// then add percentage tax, rounded to 2 decimal places.
export function calculateDiscountedTotal(price, discountPercent, taxPercent = 0) {
  // Bug 1: throws missing validation on negative price
  // Bug 2: applies tax BEFORE discount and uses Math.floor instead of Math.round
  const taxed = price * (1 + taxPercent / 100);
  const discounted = taxed - price * (discountPercent / 100);
  return Math.floor(discounted * 100) / 100;
}
