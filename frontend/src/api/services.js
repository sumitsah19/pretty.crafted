import api from './axios'

// ── AUTH ─────────────────────────────────────────────────────────
export const authApi = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  googleLogin:    (credential) => api.post('/auth/google', { credential }),
  // Phone OTP: the MSG91 widget verifies the OTP client-side and returns an
  // access token; the backend re-verifies it and issues our JWT.
  otpVerify:      (accessToken, phone) => api.post('/auth/otp/verify', { accessToken, phone }),
  me:             () => api.get('/auth/me'),
  updateMe:       (data) => api.put('/auth/me', data),
  logout:         () => api.post('/auth/logout'),
}

// ── PRODUCTS ─────────────────────────────────────────────────────
// Backend returns Page<ProductDto> for list — Spring Page shape: { content, totalElements, ... }
export const productsApi = {
  list:    (params) => api.get('/products', { params }),
  hampers: ()       => api.get('/products/hampers'),
  byId:    (id)     => api.get(`/products/${id}`),
}

// ── CART ─────────────────────────────────────────────────────────
// Backend AddCartItemRequest: { productId: Long, quantity: Integer }
// Backend UpdateCartItemRequest: { quantity: Integer }
export const cartApi = {
  get:    ()                     => api.get('/cart'),
  add:    (productId, qty = 1)   => api.post('/cart/items', { productId, quantity: qty }),
  update: (itemId, qty)          => api.patch(`/cart/items/${itemId}`, { quantity: qty }),
  remove: (itemId)               => api.delete(`/cart/items/${itemId}`),
}

// ── ORDERS ───────────────────────────────────────────────────────
// Backend PlaceOrderRequest: { shippingAddress, contactPhone, paymentMethod: "RAZORPAY"|"COD" }
// Backend gets cart items server-side; do NOT send items[] in the request.
// Backend PlaceOrderResponse: { order: OrderDto, razorpayKeyId: String }
export const ordersApi = {
  create:        (payload) => api.post('/orders', payload),
  list:          (params)  => api.get('/orders', { params }),
  byId:          (id)      => api.get(`/orders/${id}`),
  invoice:       (id)      => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
  cancel:        (id)      => api.delete(`/orders/${id}`),
  verifyPayment: (id, payload) => api.post(`/orders/${id}/payment/verify`, payload),
}

// ── GIFT BOXES ───────────────────────────────────────────────────
export const giftBoxApi = {
  create: (payload) => api.post('/gift-boxes', payload),
  list:   ()        => api.get('/gift-boxes'),
  remove: (id)      => api.delete(`/gift-boxes/${id}`),
}

// ── COUPONS (public — checkout validation) ───────────────────────
// Validation does NOT consume a use; the server redeems at order placement.
export const couponApi = {
  validate: (code) => api.get('/public/coupons/validate', { params: { code } }),
}

// ── ADDRESSES (authenticated — customer address book) ────────────
// Backend AddressRequest: { label?, recipientName, phone, line1, line2?, city, state?, zip, country?, isDefault }
export const addressApi = {
  list:       ()          => api.get('/addresses'),
  create:     (data)      => api.post('/addresses', data),
  update:     (id, data)  => api.put(`/addresses/${id}`, data),
  setDefault: (id)        => api.patch(`/addresses/${id}/default`),
  remove:     (id)        => api.delete(`/addresses/${id}`),
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

// ── FAQs (public read — Help Center accordion) ───────────────────
export const faqApi = {
  list: () => api.get('/public/faqs'),
}

// ── FAQs (admin write — Help Center CMS) ─────────────────────────
export const faqAdminApi = {
  list:   ()         => api.get('/admin/faqs'),
  create: (data)     => api.post('/admin/faqs', data),
  update: (id, data) => api.put(`/admin/faqs/${id}`, data),
  toggle: (id)       => api.patch(`/admin/faqs/${id}/toggle`),
  remove: (id)       => api.delete(`/admin/faqs/${id}`),
}

// ── RETURNS & EXCHANGES (authenticated — customer) ───────────────
// create body: { orderId, orderItemId, type: 'RETURN'|'EXCHANGE', reason, details?, images?[] }
export const returnsApi = {
  listMine: ()       => api.get('/returns'),
  create:   (data)   => api.post('/returns', data),
  upload:   (file)   => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/returns/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── RETURNS & EXCHANGES (admin) ──────────────────────────────────
export const returnsAdminApi = {
  list:         (status)     => api.get('/admin/returns', { params: status ? { status } : {} }),
  updateStatus: (id, data)   => api.patch(`/admin/returns/${id}/status`, data),
}

// ── CONTACT CHANNELS (public read — Help Center "Contact Us") ────
export const contactApi = {
  get: () => api.get('/public/contact'),
}

// ── CONTACT CHANNELS (admin write) ───────────────────────────────
export const contactAdminApi = {
  get:    ()     => api.get('/admin/contact'),
  update: (data) => api.put('/admin/contact', data),
}

// ── POLICIES (public read — footer / Legal & Policies / policy pages) ────
export const policyApi = {
  list: ()     => api.get('/public/policies'),
  get:  (slug) => api.get(`/public/policies/${slug}`),
}

// ── POLICIES (admin write — Legal & Policies CMS) ─────────────────
export const policyAdminApi = {
  list:   ()         => api.get('/admin/policies'),
  create: (data)     => api.post('/admin/policies', data),
  update: (id, data) => api.put(`/admin/policies/${id}`, data),
  toggle: (id)       => api.patch(`/admin/policies/${id}/toggle`),
  remove: (id)       => api.delete(`/admin/policies/${id}`),
}

// ── OCCASIONS (public read — "Gifts for Every Occasion" + featured banner) ──
export const occasionsApi = {
  list: () => api.get('/public/occasions'),
}

// ── OCCASIONS (admin write — occasion catalog CMS) ────────────────
export const occasionAdminApi = {
  list:   ()         => api.get('/admin/occasions'),
  create: (data)     => api.post('/admin/occasions', data),
  update: (id, data) => api.put(`/admin/occasions/${id}`, data),
  toggle: (id)       => api.patch(`/admin/occasions/${id}/toggle`),
  remove: (id)       => api.delete(`/admin/occasions/${id}`),
}

// ── HERO CARDS (public read — storefront hero CoverFlow) ─────────
export const heroCardsApi = {
  list: () => api.get('/public/hero-cards'),
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
  updateOrderTracking: (id, tracking)    => api.patch(`/admin/orders/${id}/tracking`, tracking),
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
