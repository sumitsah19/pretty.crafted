// Delivery pricing — display mirror of the backend's OrderService constants
// (FREE_DELIVERY_THRESHOLD / DELIVERY_FEE), which are the authority for what
// Razorpay actually charges. If you change one side, change the other.
export const FREE_DELIVERY_THRESHOLD = 999
export const DELIVERY_FEE = 79

// Fee for a cart whose discounted merchandise total is `amount`.
// Empty carts pay nothing; at/above the threshold delivery is free.
export const deliveryFeeFor = (amount) =>
  amount <= 0 || amount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
