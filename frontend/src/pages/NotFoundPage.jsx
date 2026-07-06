import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { useWindowWidth } from '../hooks/useWindowWidth'

const TC = '#C4704A'
const TC_DARK = '#A85A38'

// Catch-all 404 page. Unknown URLs used to render an empty storefront shell
// (HTTP 200 with no content) — a soft-404 for search engines. This page gives
// humans a way back and tells crawlers not to index the URL (SEO noIndex).
export default function NotFoundPage() {
  const isMobile = useWindowWidth() < 640
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  const pill = {
    display: 'inline-block', padding: isMobile ? '13px 28px' : '14px 34px',
    borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.3s',
  }

  return (
    <div style={{ background: '#FAF7F2', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '64px 20px' : '96px 48px' }}>
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist. Explore our handcrafted gift boxes instead." noIndex />

      <div style={{ textAlign: 'center', maxWidth: 480 }} className="animate-fade-up">
        <div style={{ fontSize: isMobile ? 44 : 56, marginBottom: 16 }} aria-hidden="true">🎁</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 56 : 80, fontWeight: 700, color: TC, lineHeight: 1, marginBottom: 12 }}>404</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#2C1A0E', marginBottom: 12 }}>
          This page seems to have unwrapped itself
        </h1>
        <p style={{ fontSize: isMobile ? 14 : 15, color: '#6B4F3A', lineHeight: 1.7, marginBottom: 32 }}>
          The link may be broken, or the page may have been moved. Don't worry — the perfect gift is still waiting for you.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" onMouseEnter={() => setPrimaryHover(true)} onMouseLeave={() => setPrimaryHover(false)}
            style={{ ...pill, background: primaryHover ? TC_DARK : TC, color: 'white', boxShadow: primaryHover ? '0 12px 40px rgba(44,26,14,0.12)' : '0 2px 12px rgba(44,26,14,0.06)' }}>
            Back to Home
          </Link>
          <Link to="/shop" onMouseEnter={() => setSecondaryHover(true)} onMouseLeave={() => setSecondaryHover(false)}
            style={{ ...pill, background: secondaryHover ? '#EDE4D8' : 'white', color: '#2C1A0E', border: '1.5px solid #EDE4D8' }}>
            Browse Gifts
          </Link>
        </div>
      </div>
    </div>
  )
}
