import posthog from 'posthog-js'

const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'

export function initAnalytics() {
  if (!KEY) return
  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,
    capture_pageview: true,
    persistence: 'localStorage',
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing()
    },
  })
}

export function identify(userId, traits = {}) {
  if (!KEY) return
  posthog.identify(String(userId), traits)
}

export function reset() {
  if (!KEY) return
  posthog.reset()
}

export function track(event, props = {}) {
  if (!KEY) return
  posthog.capture(event, props)
}

// ── Named event helpers (keeps call sites readable) ─────────────

export const analytics = {
  signup:       (method)         => track('signup',          { method }),
  login:        (method)         => track('login',           { method }),
  logout:       ()               => track('logout'),
  productView:  (product)        => track('product_viewed',  { id: product.id, name: product.name, category: product.category, price: product.price }),
  addToCart:    (product, qty)   => track('add_to_cart',     { id: product.id, name: product.name, price: product.price, qty }),
  removeFromCart:(product)       => track('remove_from_cart',{ id: product.id, name: product.name }),
  wishlistAdd:  (productId)      => track('wishlist_add',    { id: productId }),
  wishlistRemove:(productId)     => track('wishlist_remove', { id: productId }),
  search:       (query, results) => track('search',          { query, results }),
  checkoutStart:()               => track('checkout_start'),
  checkoutStep: (step)           => track('checkout_step',   { step }),
  orderPlaced:  (orderId, total) => track('order_placed',    { orderId, total }),
  giftBoxOpen:  ()               => track('gift_box_open'),
}
