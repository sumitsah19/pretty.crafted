import { memo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist, selectWishlistIds, wishlistKey } from '../../store/slices/wishlistSlice'
import { formatPrice } from '../../utils/formatPrice'
import { cloudinaryOptimized } from '../../utils/cloudinaryUrl'
import { analytics } from '../../analytics'

const SparklesSvg = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4M22 5h-4M4 17v4M6 19H2" />
  </svg>
)

export function ProductSkeleton() {
  const sh = {
    background: 'linear-gradient(90deg,#EDE4D8 25%,#E5DBD0 50%,#EDE4D8 75%)',
    backgroundSize: '400% 100%',
    animation: 'skShimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...sh, aspectRatio: '1/1', borderRadius: 14, marginBottom: 12 }} />
      <div style={{ ...sh, height: 15, width: '65%', margin: '0 auto 8px' }} />
      <div style={{ ...sh, height: 12, width: '50%', margin: '0 auto 8px' }} />
      <div style={{ ...sh, height: 13, width: '60%', margin: '0 auto' }} />
    </div>
  )
}

// Memoized: rendered 6-100+ times per grid. Props are a stable product object
// plus an onClick; wishlist state is read via its own selector inside, so this
// only re-renders when the product/onClick identity actually changes.
function ProductCard({ product, onClick }) {
  const [hover, setHover] = useState(false)
  const [wishHover, setWishHover] = useState(false)
  const dispatch = useDispatch()
  const wishlistIds = useSelector(selectWishlistIds)
  const wishlisted = wishlistIds.includes(wishlistKey(product))

  // Rating + review count come from the product data (backend or demo catalog).
  // No fabricated fallbacks: products without ratings simply don't show stars.
  const reviews  = product.reviewCount ?? product.ratingCount ?? null
  const rating   = product.rating != null ? Number(product.rating) : null
  const hasRating = rating != null
  // Actual MRP from the product data. Only treat it as a discount when it's a real number
  // strictly above the selling price; otherwise show the selling price on its own.
  const orig     = Number(product.originalPrice ?? product.origPrice)
  const hasMrp   = Number.isFinite(orig) && orig > product.price
  const save     = hasMrp ? Math.round((1 - product.price / orig) * 100) : 0
  const pct      = hasRating ? Math.max(0, Math.min(100, rating / 5 * 100)) : 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // Clickable div → make it a real keyboard target: Tab reaches it,
      // Enter/Space activate it, screen readers announce it as a button.
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
    >
      {/* Square image */}
      <div style={{
        position: 'relative', aspectRatio: '1/1', borderRadius: 14,
        background: product.bg || '#EDE4D8',
        overflow: 'hidden', marginBottom: 12,
        boxShadow: hover ? '0 10px 28px rgba(44,26,14,0.18)' : '0 1px 4px rgba(44,26,14,0.08)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.85 }}>
          {product.imageUrl
            ? <img src={cloudinaryOptimized(product.imageUrl, 400)} alt={product.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <SparklesSvg />
          }
        </div>
        {product.tag && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            padding: '5px 10px', borderRadius: 7,
            background: '#2C1A0E', color: '#fff',
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.01em', whiteSpace: 'nowrap',
          }}>
            {product.tag === 'New' ? 'New In' : product.tag}
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.stopPropagation(); (wishlisted ? analytics.wishlistRemove : analytics.wishlistAdd)(product.id); dispatch(toggleWishlist(wishlistKey(product))) }}
          onMouseEnter={() => setWishHover(true)}
          onMouseLeave={() => setWishHover(false)}
          style={{
            position: 'absolute', top: 10, left: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: wishlisted ? '#C4704A' : 'rgba(255,255,255,0.88)',
            border: wishlisted ? 'none' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            transform: wishHover ? 'scale(1.12)' : 'scale(1)',
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={wishlisted ? '#fff' : 'none'} stroke={wishlisted ? '#fff' : '#C4704A'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Name */}
      <h4 style={{ margin: '0 0 6px', textAlign: 'center', fontSize: 15, fontWeight: 600, color: '#2C1A0E', fontFamily: "'Playfair Display',serif" }}>
        {product.name}
      </h4>

      {/* Stars — only when the product actually has rating data */}
      {hasRating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}>
          <span style={{ position: 'relative', display: 'inline-block', fontSize: 13, lineHeight: 1, letterSpacing: 1, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'rgba(0,0,0,0.16)' }}>★★★★★</span>
            <span style={{ position: 'absolute', left: 0, top: 0, width: pct + '%', overflow: 'hidden', color: '#C08A1E' }}>★★★★★</span>
          </span>
          {reviews != null && <span style={{ fontSize: 12, color: '#6B4F3A', whiteSpace: 'nowrap' }}>{reviews} reviews</span>}
        </div>
      )}

      {/* Prices */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 7, whiteSpace: 'nowrap' }}>
        {hasMrp && <span style={{ fontSize: 12.5, color: '#9C7A63', textDecoration: 'line-through' }}>{formatPrice(orig)}</span>}
        <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{formatPrice(product.price)}</span>
      </div>

      {save > 0 && (
        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 12.5, fontWeight: 600, color: '#dc2626', whiteSpace: 'nowrap' }}>
          Save {save}%
        </div>
      )}
    </div>
  )
}

export default memo(ProductCard)
