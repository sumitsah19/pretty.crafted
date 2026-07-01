import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsLoggedIn, selectUser } from '../store/slices/authSlice'
import { selectCartCount } from '../store/slices/cartSlice'
import { selectWishlistIds } from '../store/slices/wishlistSlice'
import { openLogin, openSearch, openBoxBuilder, openUserAccount, openCart, openWishlist, selectUI } from '../store/slices/uiSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'
import ContactSupportSheet from './ContactSupportSheet'

const TC = '#C4704A'

export default function Nav({ onScrollTo }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Router-aware home navigation: raw history.pushState would change the URL
  // without React Router noticing, leaving route-driven state (SEO tags, route
  // matching) stuck on the previous page.
  const goHome = () => {
    if (pathname !== '/') navigate('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const user = useSelector(selectUser)
  const cartCount = useSelector(selectCartCount)
  const wishlistIds = useSelector(selectWishlistIds)
  const ui = useSelector(selectUI)
  // Nav pins on top of any full-screen overlay (product detail OR gift-box builder)
  const overlayOpen = !!ui.activeProduct || ui.showBoxBuilder
  const ww = useWindowWidth()
  const isMobile = ww < 640

  const [scrolled, setScrolled] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const sentinelRef = useRef(null)

  const navHeight = isMobile ? 60 : 72

  // Track scroll for background appearance
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Switch to fixed positioning when sentinel (placed above nav) exits viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const links = [
    { label: 'Shop',         href: '/shop',        action: () => onScrollTo?.('featured-collection') },
    { label: 'Occasions',    href: '/#occasions',  action: () => onScrollTo?.('occasions') },
    { label: 'Best Sellers', href: '/shop',        action: () => onScrollTo?.('bestsellers') },
    { label: 'Gift Boxes',   href: '/gift-boxes',  action: () => dispatch(openBoxBuilder()) },
  ]

  const mobileLinks = [
    { label: 'Shop All Gifts',   href: '/shop',       icon: '🛍️', action: () => { setMobileOpen(false); onScrollTo?.('featured-collection') } },
    { label: 'Occasions',        href: '/#occasions', icon: '✦',   action: () => { setMobileOpen(false); onScrollTo?.('occasions') } },
    { label: 'Best Sellers',     href: '/shop',       icon: '⭐',  action: () => { setMobileOpen(false); onScrollTo?.('bestsellers') } },
    { label: 'Build a Gift Box', href: '/gift-boxes', icon: '🎁',  action: () => { setMobileOpen(false); dispatch(openBoxBuilder()) } },
  ]

  const showSolid = isSticky || scrolled || (isMobile && mobileOpen) || overlayOpen

  // Lock background scroll while the full-screen mobile menu is open, and let
  // Escape close it — same convention as the app's other full-screen overlays.
  useEffect(() => {
    if (!isMobile || !mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isMobile, mobileOpen])

  return (
    <>
      {/* Sentinel — when this exits the viewport the nav locks to the top */}
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 0, pointerEvents: 'none' }} />

      {/*
        Wrapper always occupies navHeight in the document flow so there is
        no layout jump when the nav switches between relative and fixed.
      */}
      <div style={{ height: navHeight }}>
        <nav style={{
          position: isSticky || overlayOpen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: overlayOpen ? 1100 : 200,
          background: showSolid ? 'rgba(250,247,242,0.98)' : 'rgba(250,247,242,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: showSolid ? '1px solid #EDE4D8' : '1px solid transparent',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}>
          <div style={{
            height: navHeight,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            padding: isMobile ? '0 16px' : '0 48px',
            gap: 16,
          }}>

            {/* LEFT — hamburger (mobile) or nav links (desktop) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 32 }}>
              {isMobile ? (
                <button onClick={() => setMobileOpen(o => !o)} aria-label="Menu"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ display: 'block', width: 22, height: 2, background: '#2C1A0E', borderRadius: 99, transition: 'all 0.28s', transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
                  <span style={{ display: 'block', width: 22, height: 2, background: '#2C1A0E', borderRadius: 99, transition: 'all 0.28s', transform: mobileOpen ? 'scaleX(0)' : 'none', opacity: mobileOpen ? 0 : 1 }} />
                  <span style={{ display: 'block', width: 22, height: 2, background: '#2C1A0E', borderRadius: 99, transition: 'all 0.28s', transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                  {links.map((link) => (
                    <a key={link.label} href={link.href} onClick={(e) => { e.preventDefault(); link.action() }}
                      style={{ fontSize: 14, fontWeight: 500, color: '#6B4F3A', textDecoration: 'none', position: 'relative', paddingBottom: 2, transition: 'color 0.2s', whiteSpace: 'nowrap' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = TC}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#6B4F3A'}>
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* CENTER — Logo (crawlable home link + brand entity signal) */}
            <a href="/" aria-label="Prettycrafted home"
              onClick={(e) => { e.preventDefault(); goHome() }}
              style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 24, fontWeight: 700, color: '#2C1A0E', letterSpacing: '-0.02em', whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'none' }}>
              Prettycrafted
            </a>

            {/* RIGHT — icon actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 12, justifyContent: 'flex-end' }}>

              {/* Search — always visible */}
              <IconBtn onClick={() => dispatch(openSearch())} title="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </IconBtn>

              {/* Wishlist — desktop only (accessible via hamburger on mobile) */}
              {!isMobile && (
                <IconBtn onClick={() => dispatch(openWishlist())} title="Wishlist" style={{ position: 'relative' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24"
                    fill={wishlistIds.length > 0 ? TC : 'none'}
                    stroke={wishlistIds.length > 0 ? TC : 'currentColor'}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {wishlistIds.length > 0 && (
                    <span style={{ position: 'absolute', top: 4, right: 4, background: TC, color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                      {wishlistIds.length}
                    </span>
                  )}
                </IconBtn>
              )}

              {/* Cart — always visible */}
              <IconBtn onClick={() => dispatch(openCart())} title="Cart" style={{ position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24"
                  fill={cartCount > 0 ? TC : 'none'}
                  stroke={cartCount > 0 ? TC : 'currentColor'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: TC, color: 'white', borderRadius: '50%', width: 14, height: 14, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {cartCount}
                  </span>
                )}
              </IconBtn>

              {/* Account — desktop only (accessible via hamburger on mobile) */}
              {!isMobile && (
                <IconBtn
                  onClick={() => isLoggedIn ? dispatch(openUserAccount()) : dispatch(openLogin())}
                  title={isLoggedIn ? 'My Account' : 'Sign In'}
                  style={{ color: isLoggedIn ? TC : '#2C1A0E' }}>
                  {isLoggedIn && user ? (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </IconBtn>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Full-screen mobile navigation panel — an opaque, edge-to-edge takeover
          of the viewport (its own header + close button), not a floating
          dropdown card or a `.modal-backdrop` overlay. */}
      {isMobile && mobileOpen && (
        <div className="animate-slide-right" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 250,
          background: '#FAF7F2',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Panel header — same height as the nav bar so open/close feels continuous */}
          <div style={{ height: navHeight, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #EDE4D8' }}>
            <a href="/" aria-label="Prettycrafted home"
              onClick={(e) => { e.preventDefault(); setMobileOpen(false); goHome() }}
              style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2C1A0E', letterSpacing: '-0.02em', textDecoration: 'none' }}>
              Prettycrafted
            </a>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu"
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Panel body — fills the rest of the screen, scrolls internally if needed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 32px' }} className="no-scrollbar">
            {/* Quick-action tiles */}
            <div style={{ display: 'flex', gap: 8, paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid #EDE4D8' }}>
              {[
                { label: isLoggedIn ? 'Account' : 'Sign In', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, action: () => { setMobileOpen(false); setTimeout(() => isLoggedIn ? dispatch(openUserAccount()) : dispatch(openLogin()), 100) } },
                { label: 'Wish List', icon: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />, action: () => { setMobileOpen(false); setTimeout(() => dispatch(openWishlist()), 100) } },
                { label: 'Gift Finder', icon: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>, action: () => { setMobileOpen(false); setTimeout(() => dispatch(openSearch()), 100) } },
                { label: 'Help', icon: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>, action: () => { setMobileOpen(false); setTimeout(() => dispatch(openUserAccount('help')), 100) } },
              ].map(q => (
                <button key={q.label} onClick={q.action}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 4px', background: 'white', border: '1px solid #EDE4D8', borderRadius: 14, cursor: 'pointer', minHeight: 64 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{q.icon}</svg>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', whiteSpace: 'nowrap' }}>{q.label}</span>
                </button>
              ))}
            </div>

            {/* Nav links */}
            {mobileLinks.map((l, i) => (
              <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); l.action() }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 8px', background: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: i < mobileLinks.length - 1 ? '1px solid #EDE4D8' : 'none', textDecoration: 'none' }}>
                <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{l.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: '#2C1A0E' }}>{l.label}</span>
                <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9C7A63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </a>
            ))}
            {/* Need Help? — same box footprint as the old Build a Gift Box CTA
                (size/position/padding/radius), now a clean white section. */}
            <div style={{ marginTop: 12, width: '100%', padding: '14px', borderRadius: 12, background: 'white', border: '1px solid #EDE4D8', boxShadow: '0 2px 12px rgba(44,26,14,0.06)', boxSizing: 'border-box', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>Need Help?</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <HelpOutlineButton onClick={() => { setMobileOpen(false); setTimeout(() => dispatch(openUserAccount('help')), 100) }}>
                  Help Center
                </HelpOutlineButton>
                <HelpOutlineButton onClick={() => setContactOpen(true)}>
                  Contact Us
                </HelpOutlineButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <ContactSupportSheet open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}

function HelpOutlineButton({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)} onTouchEnd={() => setHover(false)}
      style={{
        flex: 1, padding: '11px 0', borderRadius: 99, border: `1.5px solid ${TC}`,
        background: hover ? TC : 'white', color: hover ? 'white' : TC,
        fontWeight: 700, fontSize: 13.5, letterSpacing: '0.01em', cursor: 'pointer',
        transition: 'all 0.2s', transform: hover ? 'scale(0.97)' : 'scale(1)',
      }}>
      {children}
    </button>
  )
}

function IconBtn({ onClick, title, children, style }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, transition: 'background 0.18s', color: '#2C1A0E', position: 'relative', ...style }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#F5EEE6'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
      {children}
    </button>
  )
}