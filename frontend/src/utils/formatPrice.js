// Single source of truth for rendering an INR amount. Always shows 2 decimals
// with Indian digit grouping, e.g. formatPrice(1499) -> "₹1,499.00".
export const formatPrice = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
