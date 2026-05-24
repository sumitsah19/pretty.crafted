import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe, logout, selectUser, resendVerification } from './store/slices/authSlice'
import { fetchProducts } from './store/slices/productsSlice'
import { selectUI, selectCartOpen, selectWishlistOpen } from './store/slices/uiSlice'
import { useWindowWidth } from './hooks/useWindowWidth'
import { useOnlineStatus } from './hooks/useOnlineStatus'
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

  useEffect(() => {
    dispatch(fetchMe())
    dispatch(fetchProducts())
  }, [dispatch])

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
      title: 'Handcrafted Gifts with Heart',
      description: 'Shop unique handcrafted gift boxes for every occasion — birthdays, anniversaries, weddings, and more. Each gift is made with love by independent artisans.',
      keywords: 'handcrafted gifts India, personalized gift boxes, artisan gifts, birthday gifts, anniversary gifts, prettycrafted',
      url: '/',
    },
    '/privacy': {
      title: 'Privacy Policy',
      description: 'Read the Pretty.Crafted privacy policy to understand how we collect, use, and protect your personal information.',
      url: '/privacy',
      noIndex: false,
    },
    '/terms': {
      title: 'Terms of Service',
      description: 'Review the Pretty.Crafted terms of service governing the use of our handcrafted gift shopping platform.',
      url: '/terms',
      noIndex: false,
    },
    '/account': {
      title: 'My Account',
      description: 'Manage your Pretty.Crafted account, view your order history, and update your profile details.',
      url: '/account',
      noIndex: true,
    },
    '/orders': {
      title: 'My Orders',
      description: 'Track and view your Pretty.Crafted gift orders.',
      url: '/orders',
      noIndex: true,
    },
  }
  const currentSEO = routeSEO[pathname] || routeSEO['/']

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

        {/* Announcement banner */}
        <div style={{ background: TC, color: 'white', textAlign: 'center', padding: isMobile ? '9px 16px' : '10px 20px', fontSize: isMobile ? 12 : 13, fontWeight: 500 }}>
          {isMobile ? '🎁 Use PRETTY15 for 15% off' : '✦ Free gift wrapping on orders over $60 — use code PRETTY15 for 15% off ✦'}
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
        ].map(([show, modal], i) => show ? (
          <ErrorBoundary key={i} inline>
            <Suspense fallback={null}>{modal}</Suspense>
          </ErrorBoundary>
        ) : null)}

      </div>
    </ErrorBoundary>
  )
}
