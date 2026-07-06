import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe, logoutThunk } from './store/slices/authSlice'
import { fetchProducts, fetchHampers, selectProducts } from './store/slices/productsSlice'
import { selectUI, selectCartOpen, selectWishlistOpen, openUserAccount, setActiveProduct } from './store/slices/uiSlice'
import { useWindowWidth } from './hooks/useWindowWidth'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { promotionsApi, marketingApi } from './api/services'
import ErrorBoundary from './components/ErrorBoundary'

import Nav from './components/Nav'
import SEO from './components/SEO'
import HomePage from './pages/HomePage'
import PolicyPage from './pages/PolicyPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

// Lazy-load the entire admin panel — ~2,400+ lines across 12 sub-views that
// ~99% of visitors (customers) never need — plus every modal/drawer, so none
// of it is in the initial bundle. Each is only downloaded the first time it's
// actually reached.
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const BuildBoxesView = lazy(() => import('./pages/admin/BuildBoxesView'))
const LoginModal = lazy(() => import('./components/modals/LoginModal'))
const CartDrawer = lazy(() => import('./components/modals/CartDrawer'))
const CheckoutModal = lazy(() => import('./components/modals/CheckoutModal'))
const GiftBoxModal = lazy(() => import('./components/modals/GiftBoxModal'))
const SearchModal = lazy(() => import('./components/modals/SearchModal'))
const WishlistDrawer = lazy(() => import('./components/modals/WishlistDrawer'))
const OccasionPage = lazy(() => import('./components/modals/OccasionPage'))
const ProductDetailModal = lazy(() => import('./components/modals/ProductDetailModal'))
const UserAccountModal = lazy(() => import('./components/modals/UserAccountModal'))
const HamperShopModal = lazy(() => import('./components/modals/HamperShopModal'))
const ShopModal = lazy(() => import('./components/modals/ShopModal'))

const TC = '#C4704A'

// Storefront announcement banner fallback, shown until /public/marketing loads
// (and kept if it never does). The live lines + visibility are admin-managed
// in Admin → Marketing → Storefront Banner; active coupons are prepended.
const BANNER_BASE = [
  '✦ Free delivery on orders above ₹999',
  '🎁 Handcrafted with love, delivered across India',
  '✦ New arrivals every week',
]

// Deep-link target for /account and /orders: renders the storefront and opens the
// account modal on the requested screen instead of a dead-end placeholder page.
function AccountRoute({ view }) {
  const dispatch = useDispatch()
  useEffect(() => { dispatch(openUserAccount(view)) }, [dispatch, view])
  return <HomePage />
}

// Deep-link target for /products/:id — gives each product a real, crawlable,
// shareable URL (ProductDetailModal's canonical tag points here) instead of
// only ever being reachable as a modal opened from a grid.
function ProductRoute() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const products = useSelector(selectProducts)
  useEffect(() => {
    const product = products.find(p => String(p.id) === id)
    if (product) dispatch(setActiveProduct(product))
  }, [dispatch, id, products])
  return <HomePage />
}

export default function App() {
  const dispatch = useDispatch()
  const ui = useSelector(selectUI)
  const cartOpen = useSelector(selectCartOpen)
  const wishlistOpen = useSelector(selectWishlistOpen)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isOnline = useOnlineStatus()
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  const [bannerMessages, setBannerMessages] = useState(BANNER_BASE)
  const [bannerEnabled, setBannerEnabled] = useState(true)

  useEffect(() => {
    dispatch(fetchMe())
    // No size param — the thunk pages through the whole catalog itself.
    dispatch(fetchProducts())
    dispatch(fetchHampers())
  }, [dispatch])

  useEffect(() => {
    // Admin-managed banner lines + visibility, with active coupon lines
    // prepended. Either request failing falls back gracefully (base lines,
    // banner shown) rather than blanking the banner.
    Promise.allSettled([marketingApi.get(), promotionsApi.list()]).then(([mk, promos]) => {
      const cfg = mk.status === 'fulfilled' ? mk.value.data : null
      if (cfg?.bannerEnabled === false) setBannerEnabled(false)
      const base = cfg?.bannerLines?.length ? cfg.bannerLines : BANNER_BASE
      const couponLines = promos.status === 'fulfilled'
        ? (promos.value.data || []).map(c => `Use code ${c.code} for ${c.discountPercent}% off`)
        : []
      setBannerMessages([...couponLines, ...base])
    })
  }, [])

  useEffect(() => {
    // Same cleanup as the manual "Log Out" button (backend cookie clear +
    // analytics reset) — a forced logout from a 401 must not leave a stale
    // pc_token cookie server-side or keep tracking under the old identity.
    const handleForceLogout = () => dispatch(logoutThunk())
    window.addEventListener('pc:logout', handleForceLogout)
    return () => window.removeEventListener('pc:logout', handleForceLogout)
  }, [dispatch])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
  }

  // ── Route → SEO mapping ─────────────────────────────────────────
  const routeSEO = {
    '/': {
      // No title → SEO.jsx default fires: "Prettycrafted | Handcrafted Gift Boxes & Personalized Gifts India"
      description: 'Prettycrafted — shop unique handcrafted gift boxes for every occasion. Birthdays, anniversaries, weddings, and more. Each gift is made with love by independent artisans.',
      keywords: 'Prettycrafted, handcrafted gifts India, personalized gift boxes, artisan gifts, birthday gifts, anniversary gifts',
      url: '/',
    },
    '/shop': {
      title: 'Shop Handcrafted Gifts',
      description: 'Browse the full Prettycrafted collection — handmade jewellery, candles, ceramics, art prints, skincare, and personalised gift boxes, all crafted with love.',
      keywords: 'Prettycrafted shop, buy handcrafted gifts India, artisan gifts online, prettycrafted gifts',
      url: '/shop',
    },
    '/gift-boxes': {
      title: 'Custom Gift Boxes',
      description: 'Build a personalised Prettycrafted gift box. Choose from curated handcrafted items and create a unique gift tailored to your loved one.',
      keywords: 'custom gift boxes India, personalised gift hampers, Prettycrafted gift box builder',
      url: '/gift-boxes',
    },
    '/occasions': {
      title: 'Gifts by Occasion',
      description: 'Find the perfect handcrafted gift for every occasion at Prettycrafted — birthdays, anniversaries, weddings, corporate gifting, and more.',
      keywords: 'occasion gifts India, birthday gift ideas, anniversary gifts, Prettycrafted occasions',
      url: '/occasions',
    },
    '/occasions/birthday': {
      title: 'Birthday Gifts',
      description: 'Make birthdays unforgettable with Prettycrafted handcrafted birthday gifts — personalised gift boxes, artisan jewellery, candles, and more.',
      keywords: 'birthday gifts India, handcrafted birthday presents, personalised birthday gift boxes, Prettycrafted birthday',
      url: '/occasions/birthday',
    },
    '/occasions/anniversary': {
      title: 'Anniversary Gifts',
      description: 'Celebrate years of love with Prettycrafted anniversary gifts — curated handcrafted gift boxes, jewellery, and keepsakes made with heart.',
      keywords: 'anniversary gifts India, handcrafted anniversary presents, personalised anniversary gifts, Prettycrafted',
      url: '/occasions/anniversary',
    },
    '/occasions/wedding': {
      title: 'Wedding Gifts',
      description: 'Gift the couple something truly special — Prettycrafted handcrafted wedding gifts and personalised gift boxes for the start of forever.',
      keywords: 'wedding gifts India, handcrafted wedding presents, Prettycrafted wedding gifts',
      url: '/occasions/wedding',
    },
    '/occasions/corporate': {
      title: 'Corporate Gifts',
      description: 'Premium handcrafted corporate gifts from Prettycrafted — thoughtful, on-brand gift boxes for employees, clients, and partners.',
      keywords: 'corporate gifts India, premium corporate gifting, handcrafted business gifts, Prettycrafted corporate',
      url: '/occasions/corporate',
    },
    '/privacy': {
      title: 'Privacy Policy',
      description: 'Read the Prettycrafted privacy policy to understand how we collect, use, and protect your personal information when you shop with us.',
      url: '/privacy',
      noIndex: false,
    },
    '/terms': {
      title: 'Terms of Service',
      description: 'Review the Prettycrafted terms of service governing the use of our handcrafted gift shopping platform, orders, returns, and payments.',
      url: '/terms',
      noIndex: false,
    },
    '/return-refund-policy': {
      title: 'Return & Refund Policy',
      description: 'Learn how returns, exchanges, and refunds work at Prettycrafted — eligibility windows, process, and timelines.',
      url: '/return-refund-policy',
      noIndex: false,
    },
    '/shipping-delivery-policy': {
      title: 'Shipping & Delivery Policy',
      description: 'Delivery areas, timelines, and charges for Prettycrafted orders shipped across India.',
      url: '/shipping-delivery-policy',
      noIndex: false,
    },
    '/cancellation-policy': {
      title: 'Cancellation Policy',
      description: 'When and how you can cancel a Prettycrafted order, applicable charges, and refund timelines.',
      url: '/cancellation-policy',
      noIndex: false,
    },
    '/cookie-policy': {
      title: 'Cookie Policy & Settings',
      description: 'What cookies Prettycrafted uses and how to manage your Essential, Functional, Analytics, and Marketing cookie preferences.',
      url: '/cookie-policy',
      noIndex: false,
    },
    '/payment-terms': {
      title: 'Payment Terms',
      description: 'Accepted payment methods, currency, security, and refund handling for Prettycrafted orders.',
      url: '/payment-terms',
      noIndex: false,
    },
    '/contact-support': {
      title: 'Contact & Customer Support',
      description: 'How to reach Prettycrafted customer support, our support hours, and grievance redressal contact.',
      url: '/contact-support',
      noIndex: false,
    },
    '/account': {
      title: 'My Account',
      description: 'Manage your Prettycrafted account, view your order history, and update your profile details.',
      url: '/account',
      noIndex: true,
    },
    '/orders': {
      title: 'My Orders',
      description: 'Track and view your Prettycrafted gift orders.',
      url: '/orders',
      noIndex: true,
    },
  }
  const currentSEO = routeSEO[pathname]
    || (pathname.startsWith('/occasions/') ? routeSEO['/occasions'] : null)
    // Falls back to the shop's generic SEO until ProductDetailModal's own <SEO>
    // (with the real per-product title/description/canonical) takes over once
    // the product loads.
    || (pathname.startsWith('/products/') ? routeSEO['/shop'] : null)
    // A specific order page is auth-gated private data — noIndex like /orders,
    // rather than falling through to the indexable homepage SEO.
    || (pathname.startsWith('/orders/') ? { title: 'My Order', description: routeSEO['/orders'].description, url: pathname, noIndex: true } : null)
    || routeSEO['/']

  // Admin has its own full-page layout — skip storefront shell entirely
  if (isAdmin) {
    return (
      <ErrorBoundary>
        <SEO title="Admin Dashboard" url="/admin" noIndex />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    )
  }

  // Dev-only admin routes (local debugging) — allow opening the admin views
  // directly without authentication. Only enabled on localhost.
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  return (
    <ErrorBoundary>
      {/* Route-level SEO — updates on every navigation */}
      <SEO {...currentSEO} />
      <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: isMobile ? 64 : 0 }}>

        {/* Offline banner */}
        {!isOnline && (
          <div style={{ background: '#2C1A0E', color: 'white', textAlign: 'center', padding: '10px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>📡</span> You're offline — browsing cached content. Some features may be unavailable.
          </div>
        )}

        {/* Announcement banner — scrolling marquee (active coupons + brand lines),
            admin-toggleable via Admin → Marketing. The moving track is decorative
            (aria-hidden); screen readers get the same messages once, as static text. */}
        {bannerEnabled && bannerMessages.length > 0 && (
          <div style={{ background: TC, color: 'white', padding: isMobile ? '9px 0' : '10px 0', fontSize: isMobile ? 12 : 13, fontWeight: 500, overflow: 'hidden' }}>
            <span className="sr-only">{bannerMessages.join('. ')}</span>
            <div className="marquee-track" aria-hidden="true">
              {Array.from({ length: 2 }).map((_, rep) => (
                bannerMessages.map((msg, i) => (
                  <span key={`${rep}-${i}`} className="marquee-item">{msg}</span>
                ))
              ))}
            </div>
          </div>
        )}

        <Nav onScrollTo={scrollTo} />

        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* SEO landing pages — same storefront content, distinct metadata per route */}
          <Route path="/shop" element={<HomePage />} />
          <Route path="/gift-boxes" element={<HomePage />} />
          <Route path="/occasions" element={<HomePage />} />
          <Route path="/occasions/:id" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductRoute />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountRoute view="home" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <AccountRoute view="orders" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<PolicyPage slug="privacy-policy" />} />
          <Route path="/terms" element={<PolicyPage slug="terms-of-service" />} />
          <Route path="/return-refund-policy" element={<PolicyPage slug="return-refund-policy" />} />
          <Route path="/shipping-delivery-policy" element={<PolicyPage slug="shipping-delivery-policy" />} />
          <Route path="/cancellation-policy" element={<PolicyPage slug="cancellation-policy" />} />
          <Route path="/cookie-policy" element={<PolicyPage slug="cookie-policy" />} />
          <Route path="/payment-terms" element={<PolicyPage slug="payment-terms" />} />
          <Route path="/contact-support" element={<PolicyPage slug="contact-support" />} />
          <Route path="/policies/:slug" element={<PolicyPage />} />
          {isLocalhost && (
            <>
              <Route path="/__dev/admin/buildboxes" element={<BuildBoxesView />} />
            </>
          )}
          {/* Catch-all 404 — unknown URLs previously rendered an empty storefront
              shell (a soft-404 for crawlers). The page is noIndex'd via SEO. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>

        {/* Modals — each in its own Suspense+ErrorBoundary so one crash
            or load failure never takes down the whole storefront */}
        {[
          // key remounts the page/modal when the subject changes, resetting all internal state
          [ui.activeOccasion,         <OccasionPage key={ui.activeOccasion?.id} occasion={ui.activeOccasion} />],
          [ui.showLogin,              <LoginModal />],
          [cartOpen,                  <CartDrawer />],
          [ui.showCheckout,           <CheckoutModal />],
          [ui.showBoxBuilder,         <GiftBoxModal />],
          [ui.showSearch,             <SearchModal />],
          [wishlistOpen,              <WishlistDrawer />],
          [ui.activeProduct,          <ProductDetailModal key={ui.activeProduct?.id} product={ui.activeProduct} />],
          [ui.showUserAccount,        <UserAccountModal />],
          [ui.showHamperShop,         <HamperShopModal />],
          [ui.showShop,               <ShopModal />],
        ].map(([show, modal], i) => show ? (
          <ErrorBoundary key={i} inline>
            <Suspense fallback={null}>{modal}</Suspense>
          </ErrorBoundary>
        ) : null)}

      </div>
    </ErrorBoundary>
  )
}
