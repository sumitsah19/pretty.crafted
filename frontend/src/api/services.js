import api from './axios'

// ── AUTH ─────────────────────────────────────────────────────────
export const authApi = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  register:       (name, email, password) => api.post('/auth/register', { name, email, password }),
  googleLogin:    (credential) => api.post('/auth/google', { credential }),
  me:             () => api.get('/auth/me'),
  updateMe:       (data) => api.put('/auth/me', data),
  logout:         () => api.post('/auth/logout'),
  forgotPassword:       (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:        (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  verifyEmail:          (token) => api.get('/auth/verify-email', { params: { token } }),
  resendVerification:   () => api.post('/auth/resend-verification'),
}

// ── PRODUCTS ─────────────────────────────────────────────────────
// Backend returns Page<ProductDto> for list — Spring Page shape: { content, totalElements, ... }
export const productsApi = {
  list:    (params) => api.get('/products', { params }),
  popular: ()       => api.get('/products/popular'),
  hampers: ()       => api.get('/products/hampers'),
  byId:    (id)     => api.get(`/products/${id}`),
  search:  (q, filters) => api.get('/products', { params: { q, ...filters } }),
}

// ── CART ─────────────────────────────────────────────────────────
// Backend AddCartItemRequest: { productId: Long, quantity: Integer }
// Backend UpdateCartItemRequest: { quantity: Integer }
export const cartApi = {
  get:    ()                     => api.get('/cart'),
  add:    (productId, qty = 1)   => api.post('/cart/items', { productId, quantity: qty }),
  update: (itemId, qty)          => api.patch(`/cart/items/${itemId}`, { quantity: qty }),
  remove: (itemId)               => api.delete(`/cart/items/${itemId}`),
  clear:  ()                     => api.delete('/cart'),
}

// ── ORDERS ───────────────────────────────────────────────────────
// Backend PlaceOrderRequest: { shippingAddress, contactPhone, paymentMethod: "RAZORPAY"|"COD" }
// Backend gets cart items server-side; do NOT send items[] in the request.
// Backend PlaceOrderResponse: { order: OrderDto, razorpayKeyId: String }
export const ordersApi = {
  create:        (payload) => api.post('/orders', payload),
  list:          (params)  => api.get('/orders', { params }),
  byId:          (id)      => api.get(`/orders/${id}`),
  cancel:        (id)      => api.delete(`/orders/${id}`),
  verifyPayment: (id, payload) => api.post(`/orders/${id}/payment/verify`, payload),
}

export const paymentsApi = {
  createOrder: ({ amount, currency = 'INR', receipt }) => api.post('/create-order', { amount, currency, receipt }),
}

// ── GIFT BOXES ───────────────────────────────────────────────────
export const giftBoxApi = {
  create: (payload) => api.post('/gift-boxes', payload),
  list:   ()        => api.get('/gift-boxes'),
  remove: (id)      => api.delete(`/gift-boxes/${id}`),
}

// ── CATEGORIES ───────────────────────────────────────────────────
export const categoriesApi = {
  list:   ()          => api.get('/categories'),
  create: (data)      => api.post('/categories', data),
  update: (id, data)  => api.put(`/categories/${id}`, data),
  remove: (id)        => api.delete(`/categories/${id}`),
}

// ── PROMOTIONS (public — storefront banner) ──────────────────────
export const promotionsApi = {
  list: () => api.get('/public/promotions'),
}

// ── HERO CARDS (public read — storefront hero CoverFlow) ─────────
export const heroCardsApi = {
  list: () => api.get('/public/hero-cards'),
}

// ── HERO CARDS (admin write) ─────────────────────────────────────
export const heroCardAdminApi = {
  list:   ()         => api.get('/admin/hero-cards'),
  create: (data)     => api.post('/admin/hero-cards', data),
  update: (id, data) => api.put(`/admin/hero-cards/${id}`, data),
  toggle: (id)       => api.patch(`/admin/hero-cards/${id}/toggle`),
  remove: (id)       => api.delete(`/admin/hero-cards/${id}`),
}

// ── BUILD BOXES (public read — "Build Your Own Box" CoverFlow) ───
export const buildBoxApi = {
  list: () => api.get('/public/build-boxes'),
  // Box-size base fees + wrap costs, straight from the backend enums
  config: () => api.get('/public/box-config'),
}

// ── BUILD BOXES (admin write) ────────────────────────────────────
export const buildBoxAdminApi = {
  list:   ()         => api.get('/admin/build-boxes'),
  create: (data)     => api.post('/admin/build-boxes', data),
  update: (id, data) => api.put(`/admin/build-boxes/${id}`, data),
  toggle: (id)       => api.patch(`/admin/build-boxes/${id}/toggle`),
  remove: (id)       => api.delete(`/admin/build-boxes/${id}`),
}

// ── COUPONS (admin write) ─────────────────────────────────────────
export const couponAdminApi = {
  list:   ()     => api.get('/admin/coupons'),
  create: (data) => api.post('/admin/coupons', data),
  toggle: (id)   => api.patch(`/admin/coupons/${id}/toggle`),
  remove: (id)   => api.delete(`/admin/coupons/${id}`),
}

// ── ADMIN ─────────────────────────────────────────────────────────
export const adminApi = {
  stats:             ()                  => api.get('/admin/stats'),
  updateStock:       (id, quantity)      => api.patch(`/admin/products/${id}/stock`, { quantity }),
  orders:            (params)            => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, status)        => api.patch(`/admin/orders/${id}/status`, { status }),
  customers:         (params)            => api.get('/admin/customers', { params }),
  testEmail:         (to)               => api.get('/admin/test-email', { params: { to } }),
}

// ── REVIEWS ──────────────────────────────────────────────────────
// GET /products/{id}/reviews → public (Chain 1)
// GET /reviews/can-review/{id} → authenticated (Chain 2)
// POST /reviews → authenticated (Chain 2); body: { productId, rating, body }
export const reviewsApi = {
  list:      (productId)        => api.get(`/products/${productId}/reviews`),
  canReview: (productId)        => api.get(`/reviews/can-review/${productId}`),
  submit:    (productId, data)  => api.post('/reviews', { productId, ...data }),
}

// ── UPLOADS ───────────────────────────────────────────────────────
export const uploadApi = {
  image: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── PRODUCTS (admin write) ────────────────────────────────────────
// Read methods already in productsApi above; write methods need ADMIN role
export const productAdminApi = {
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
}
