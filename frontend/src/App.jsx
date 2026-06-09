import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe, logout, selectUser, resendVerification } from './store/slices/authSlice'
import { fetchProducts } from './store/slices/productsSlice'
import { selectUI, selectCartOpen, selectWishlistOpen } from './store/slices/uiSlice'
import { useWindowWidth } from './hooks/useWindowWidth'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { promotionsApi } from './api/services'
import ErrorBoundary from './components/ErrorBoundary'

import Nav from './components/Nav'
import SEO from './components/SEO'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

// Lazy-load every modal/drawer so they are excluded from the initial bundle.
// Each is only downloaded the first time it is opened.
const LoginModal = lazy(() => import('./components/modals/LoginModal'))
const CartDrawer = lazy(() => import('./components/modals/CartDrawer'))
const CheckoutModal = lazy(() => import('./components/modals/CheckoutModal'))
const GiftBoxModal = lazy(() => import('./components/modals/GiftBoxModal'))
const SearchModal = lazy(() => import('./components/modals/SearchModal'))
const WishlistDrawer = lazy(() => import('./components/modals/WishlistDrawer'))
const OccasionsModal = lazy(() => import('./components/modals/OccasionsModal'))
const OccasionPage = lazy(() => import('./components/modals/OccasionPage'))
const ProductDetailModal = lazy(() => import('./components/modals/ProductDetailModal'))
const PersonalizationModal = lazy(() => import('./components/modals/PersonalizationModal'))
const UserAccountModal = lazy(() => import('./components/modals/UserAccountModal'))
const HamperShopModal = lazy(() => import('./components/modals/HamperShopModal'))
const ShopModal = lazy(() => import('./components/modals/ShopModal'))

const TC = '#C4704A'

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
  const isVerifyEmail = pathname === '/verify-email'
  const user = useSelector(selectUser)
  const [resendState, setResendState] = useState('idle') // idle | loading | sent | error

  // Storefront announcement banner — active coupons (from backend) + evergreen brand lines
  const BANNER_BASE = [
    '✦ Free gift wrapping on orders over ₹5000',
    '🎁 Handcrafted with love, delivered across India',
    '✦ New arrivals every week',
  ]
  const [bannerMessages, setBannerMessages] = useState(BANNER_BASE)

  useEffect(() => {
    dispatch(fetchMe())
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    promotionsApi.list()
      .then(({ data }) => {
        const couponLines = (data || []).map(c => `Use code ${c.code} for ${c.discountPercent}% off`)
        setBannerMessages([...couponLines, ...BANNER_BASE])
      })
      .catch(() => { /* keep base messages */ })
  }, [])

  useEffect(() => {
    const handleForceLogout = () => dispatch(logout())
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
    || (pathname.startsWith('/occasions/') ? routeSEO[pathname] || routeSEO['/occasions'] : null)
    || routeSEO['/']

  // Verify-email page is standalone — no nav or storefront shell
  if (isVerifyEmail) {
    return (
      <ErrorBoundary>
        <SEO title="Verify Your Email" url="/verify-email" noIndex />
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </ErrorBoundary>
    )
  }

  // Reset-password page is standalone — user arrives from email link, not logged in
  if (pathname === '/reset-password') {
    return (
      <ErrorBoundary>
        <SEO title="Reset Your Password" url="/reset-password" noIndex />
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </ErrorBoundary>
    )
  }

  // Admin has its own full-page layout — skip storefront shell entirely
  if (isAdmin) {
    return (
      <ErrorBoundary>
        <SEO title="Admin Dashboard" url="/admin" noIndex />
        <Routes>
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          } />
        </Routes>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      {/* Route-level SEO — updates on every navigation */}
      <SEO {...currentSEO} />
      <div style={{ minHeight: '100vh', background: '#FAF7F2', paddingBottom: isMobile ? 64 : 0 }}>

        {/* Offline banner */}
        {!isOnline && (
          <div style={{ background: '#1F2937', color: 'white', textAlign: 'center', padding: '10px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span>📡</span> You're offline — browsing cached content. Some features may be unavailable.
          </div>
        )}

        {/* Announcement banner — scrolling marquee (active coupons + brand lines) */}
        <div style={{ background: TC, color: 'white', padding: isMobile ? '9px 0' : '10px 0', fontSize: isMobile ? 12 : 13, fontWeight: 500, overflow: 'hidden' }}>
          <div className="marquee-track" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, rep) => (
              bannerMessages.map((msg, i) => (
                <span key={`${rep}-${i}`} className="marquee-item">{msg}</span>
              ))
            ))}
          </div>
        </div>

        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A', padding: isMobile ? '10px 16px' : '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#92400E' }}>
              {resendState === 'sent'
                ? '✅ Verification email sent — check your inbox.'
                : resendState === 'error'
                ? '❌ Failed to send. Please try again.'
                : '✉️ Please verify your email address to secure your account.'}
            </span>
            {resendState !== 'sent' && (
              <button
                disabled={resendState === 'loading'}
                onClick={async () => {
                  setResendState('loading')
                  try {
                    await dispatch(resendVerification()).unwrap()
                    setResendState('sent')
                  } catch {
                    setResendState('error')
                    setTimeout(() => setResendState('idle'), 4000)
                  }
                }}
                style={{ fontSize: 12, fontWeight: 700, color: '#92400E', background: 'none', border: '1px solid #D97706', borderRadius: 99, padding: '3px 12px', cursor: resendState === 'loading' ? 'default' : 'pointer', opacity: resendState === 'loading' ? 0.6 : 1 }}>
                {resendState === 'loading' ? 'Sending...' : 'Resend email'}
              </button>
            )}
          </div>
        )}

        <Nav onScrollTo={scrollTo} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* SEO landing pages — same storefront content, distinct metadata per route */}
          <Route path="/shop" element={<HomePage />} />
          <Route path="/gift-boxes" element={<HomePage />} />
          <Route path="/occasions" element={<HomePage />} />
          <Route path="/occasions/:id" element={<HomePage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <div style={{ padding: isMobile ? '40px 20px' : '60px 48px', textAlign: 'center' }}>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 32, fontWeight: 700 }}>My Account</h1>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <div style={{ padding: isMobile ? '40px 20px' : '60px 48px', textAlign: 'center' }}>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 32, fontWeight: 700 }}>My Orders</h1>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>

        {/* Modals — each in its own Suspense+ErrorBoundary so one crash
            or load failure never takes down the whole storefront */}
        {[
          [ui.activeOccasion,         <OccasionPage occasion={ui.activeOccasion} />],
          [ui.showLogin,              <LoginModal />],
          [cartOpen,                  <CartDrawer />],
          [ui.showCheckout,           <CheckoutModal />],
          [ui.showBoxBuilder,         <GiftBoxModal />],
          [ui.showSearch,             <SearchModal />],
          [wishlistOpen,              <WishlistDrawer />],
          [ui.showOccasions,          <OccasionsModal />],
          [ui.activeProduct,          <ProductDetailModal product={ui.activeProduct} />],
          [ui.personalizationProduct, <PersonalizationModal />],
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
