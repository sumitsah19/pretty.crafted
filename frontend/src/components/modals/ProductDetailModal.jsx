import { useState, useEffect, useRef, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearActiveProduct, setActiveProduct, openCart, openLogin } from '../../store/slices/uiSlice'
import SEO from '../SEO'
import { addLocal } from '../../store/slices/cartSlice'
import { toggleWishlist, selectWishlistIds, wishlistKey } from '../../store/slices/wishlistSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { useModalFocus } from '../../hooks/useModalFocus'
import { analytics } from '../../analytics'
import { reviewsApi } from '../../api/services'
import { cloudinaryOptimized } from '../../utils/cloudinaryUrl'

const TC = '#C4704A'

// Renders an admin-managed rich-text field. Text is stored with newlines
// preserved (entered via the admin textarea); falls back to a neutral empty
// state when the admin has not provided any content for this product.
function TabContent({ value }) {
  if (!value || !value.trim()) {
    return <div style={{ fontSize: 14, color: '#9C7A63', fontStyle: 'italic', lineHeight: 1.8 }}>No information available</div>
  }
  return <div style={{ fontSize: 14, color: '#6B4F3A', lineHeight: 1.8, maxWidth: 680, whiteSpace: 'pre-wrap' }}>{value}</div>
}

function StarRating({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= Math.round(rating) ? TC : '#E5DBCC', fontSize: size }}>★</span>)}
    </span>
  )
}

export default function ProductDetailModal({ product }) {
  const dispatch = useDispatch()
  const dialogRef = useModalFocus()
  const allProducts = useSelector(selectProducts)
  const wishlistIds = useSelector(selectWishlistIds)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const ww = useWindowWidth()
  const isMobile = ww < 768
  // Match the live nav height so the full-screen page starts right below it
  const navH = ww < 640 ? 60 : 72
  const isWishlisted = wishlistIds.includes(wishlistKey(product))

  useEffect(() => { analytics.productView(product) }, [product])

  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false })
  const [addedFlash, setAddedFlash] = useState(false)
  const galleryRef = useRef(null)
  const similarRef = useRef(null)
  const touchStartX = useRef(0)
  const backdropRef = useRef(null)

  // ── Reviews state ────────────────────────────────────────────────
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true) // fetch starts on mount
  const [canReview, setCanReview] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState('')
  const [reviewHover, setReviewHover] = useState(0)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitDone, setSubmitDone] = useState(false)

  // Build gallery from the product's own images; always at least 1 entry
  const gallery = useMemo(() => {
    const urls = product.imageUrls?.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : [])
    if (urls.length === 0) return [{ imageUrl: null, bg: product.bg || '#EDE4D8' }]
    return urls.map(url => ({ imageUrl: url, bg: product.bg || '#EDE4D8' }))
  }, [product])

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const ratingDist = [5,4,3,2,1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }))

  // A product can belong to more than one category now, so "same category" is
  // an overlap check (shares at least one) rather than exact-match equality.
  const similar = useMemo(() => {
    const sharesCategory = p => (p.categories || []).some(c => (product.categories || []).includes(c))
    const sameCat = allProducts.filter(p => p.id !== product.id && sharesCategory(p))
    return sameCat.length > 0 ? sameCat.slice(0, 8) : allProducts.filter(p => p.id !== product.id).slice(0, 8)
  }, [product, allProducts])

  const alsoLike = useMemo(() => {
    const sharesCategory = p => (p.categories || []).some(c => (product.categories || []).includes(c))
    return allProducts.filter(p => p.id !== product.id && !sharesCategory(p)).slice(0, 8)
  }, [product, allProducts])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') dispatch(clearActiveProduct()) }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [dispatch])

  // No reset-on-product-change effect needed: App keys this modal by product id,
  // so switching products remounts it with fresh initial state.

  useEffect(() => {
    let cancelled = false
    reviewsApi.list(product.id)
      .then(res => { if (!cancelled) setReviews(res.data) })
      .catch(() => { /* reviews stay empty */ })
      .finally(() => { if (!cancelled) setReviewsLoading(false) })
    return () => { cancelled = true }
  }, [product.id])

  useEffect(() => {
    if (!isLoggedIn) return // render-guarded: the review form also checks isLoggedIn
    reviewsApi.canReview(product.id)
      .then(res => setCanReview(res.data.canReview))
      .catch(() => setCanReview(false))
  }, [product.id, isLoggedIn, submitDone])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setSubmitLoading(true); setSubmitError(null)
    try {
      const { data } = await reviewsApi.submit(product.id, { rating: reviewRating, body: reviewBody })
      setReviews(prev => [data, ...prev])
      setSubmitDone(true)
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) dispatch(addLocal(product))
    setAddedFlash(true)
    setTimeout(() => setAddedFlash(false), 1600)
  }

  const onImageMouseMove = e => {
    if (isMobile) return
    const rect = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, active: true })
  }

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) setActiveImage(prev => Math.max(0, Math.min(gallery.length - 1, prev + (dx < 0 ? 1 : -1))))
  }

  const scrollCarousel = (ref, dir) => { ref.current?.scrollBy({ left: dir * (isMobile ? 200 : 300), behavior: 'smooth' }) }

  // Real stock from the catalog — never fabricate availability. A product with
  // no stock field (shouldn't happen, but demo/partial data) is treated as
  // available and left for the server to reject at checkout.
  const stock = Number(product.stock)
  const outOfStock = Number.isFinite(stock) && stock <= 0
  const lowStock = Number.isFinite(stock) && stock > 0 && stock <= 5

  const TABS = [
    { key: 'description', label: 'Description' },
    { key: 'materials',   label: 'Materials'   },
    { key: 'care',        label: 'Care'         },
    { key: 'shipping',    label: 'Shipping'     },
    { key: 'reviews',     label: reviewsLoading ? 'Reviews' : `Reviews (${reviews.length})` },
  ]

  const MiniCard = ({ p }) => (
    <div onClick={() => dispatch(setActiveProduct(p))}
      role="button" tabIndex={0} aria-label={`View ${p.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch(setActiveProduct(p)) } }}
      style={{ flexShrink: 0, width: isMobile ? 150 : 188, cursor: 'pointer', borderRadius: 16, overflow: 'hidden', background: 'white', border: '1px solid #EDE4D8', transition: 'transform 0.2s, box-shadow 0.2s', scrollSnapAlign: 'start' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(44,26,14,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ height: isMobile ? 110 : 140, background: p.bg||'#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {p.imageUrl && <img src={cloudinaryOptimized(p.imageUrl, 200)} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 5, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: TC, fontSize: 14 }}>₹{p.price}</span>
          {Number(p.stock) <= 0
            ? <span style={{ fontSize: 10, fontWeight: 700, color: '#9C7A63' }}>Out of stock</span>
            : <button onClick={e => { e.stopPropagation(); dispatch(addLocal(p)) }} style={{ padding: '4px 10px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Add</button>}
        </div>
      </div>
    </div>
  )

  return (
    <>
    <SEO
      title={product.name}
      description={`${product.name} — ${product.categories?.[0] || ''}. Handcrafted by independent artisans. ₹${product.price}. Shop at Prettycrafted.`}
      url={`/products/${product.id}`}
      product={product}
      type="product"
    />
    <div ref={backdropRef} className="modal-backdrop" onClick={e => e.target === e.currentTarget && dispatch(clearActiveProduct())}
      style={{ alignItems: 'flex-start', padding: 0, top: navH, background: '#FAF7F2', backdropFilter: 'none', overflowY: 'auto' }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={product.name} style={{ background: '#FAF7F2', width: '100%', maxWidth: 1100, borderRadius: 0, boxShadow: 'none', overflow: 'hidden', minHeight: `calc(100vh - ${navH}px)`, margin: '0 auto' }}
        className="animate-fade-up">

        {/* Sticky top bar — breadcrumb + close */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(250,247,242,0.95)', backdropFilter: 'blur(8px)', padding: isMobile ? '14px 16px' : '16px 28px', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#9C7A63', display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => dispatch(clearActiveProduct())}>Home</span>
            <span>›</span>
            <span style={{ cursor: 'pointer' }} onClick={() => dispatch(clearActiveProduct())}>{product.categories?.[0]}</span>
            <span>›</span>
            <span style={{ color: '#2C1A0E', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
          </div>
          <button onClick={() => dispatch(clearActiveProduct())} aria-label="Close" style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>×</button>
        </div>

        {/* Main grid: gallery + info */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', gap: isMobile ? 0 : 36, padding: isMobile ? 0 : '32px 36px' }}>

          {/* Gallery */}
          <div>
            {/* Main image */}
            <div ref={galleryRef}
              onMouseMove={onImageMouseMove}
              onMouseLeave={() => setZoom(z => ({ ...z, active: false }))}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              style={{ position: 'relative', aspectRatio: '1/1', borderRadius: isMobile ? 0 : 20, background: gallery[activeImage].bg||'#EDE4D8', overflow: 'hidden', cursor: isMobile ? 'default' : 'zoom-in', transition: 'background 0.4s ease' }}>
              {product.tag && (
                <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
                  <span style={{ background: TC, color: 'white', fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{product.tag}</span>
                </div>
              )}
              {/* Wishlist heart — top-right of gallery image */}
              <button onClick={() => dispatch(toggleWishlist(wishlistKey(product)))}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(44,26,14,0.12)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? TC : 'none'} stroke={TC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {gallery[activeImage].imageUrl ? (
                <img src={cloudinaryOptimized(gallery[activeImage].imageUrl, 800)} alt={`${product.name} — image ${activeImage + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: zoom.active ? `scale(1.5) translate(${(50 - zoom.x) * 0.4}%, ${(50 - zoom.y) * 0.4}%)` : 'scale(1)', transition: zoom.active ? 'transform 0.1s linear' : 'transform 0.3s ease', transformOrigin: `${zoom.x}% ${zoom.y}%` }} />
              ) : null}
              {!isMobile && <div style={{ position: 'absolute', bottom: 12, right: 14, fontSize: 11, color: 'rgba(44,26,14,0.4)', fontWeight: 600 }}>Hover to zoom</div>}
              {isMobile && (
                <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                  {gallery.map((_, i) => <div key={i} style={{ width: i === activeImage ? 20 : 6, height: 6, borderRadius: 99, background: i === activeImage ? TC : 'rgba(44,26,14,0.25)', transition: 'all 0.3s' }} />)}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                {gallery.map((p, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    style={{ width: 72, height: 72, borderRadius: 12, background: p.bg||'#EDE4D8', border: `2px solid ${i === activeImage ? TC : '#EDE4D8'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s', overflow: 'hidden', flexShrink: 0 }}>
                    {p.imageUrl && <img src={cloudinaryOptimized(p.imageUrl, 100)} alt={`${product.name} thumbnail ${i + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div style={{ padding: isMobile ? '20px 20px 0' : '4px 0 0' }}>
            <div style={{ fontSize: 11, color: '#9C7A63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{product.categories?.[0]}</div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.15, marginBottom: 12 }}>{product.name}</h1>

            {/* Rating summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              {reviews.length > 0 && <>
                <StarRating rating={avgRating} size={15} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{avgRating.toFixed(1)}</span>
                <span style={{ fontSize: 13, color: '#9C7A63', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('reviews')}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </>}
              {outOfStock
                ? <span style={{ fontSize: 12, color: '#C44A4A', fontWeight: 700 }}>Out of stock</span>
                : lowStock
                  ? <span style={{ fontSize: 12, color: '#C08A1E', fontWeight: 700 }}>Only {stock} left</span>
                  : <span style={{ fontSize: 12, color: '#7A9A6B', fontWeight: 600 }}>✓ In Stock</span>}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: TC }}>₹{product.price}</span>
              {/* Only treat the MRP as a discount when it's strictly above the selling price (matches ProductCard) */}
              {product.originalPrice > product.price && <span style={{ fontSize: 16, color: '#B8A090', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>}
              {product.originalPrice > product.price && <span style={{ fontSize: 12, background: '#EAF2E8', color: '#2A7A3B', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
            </div>

            {/* Qty + Add to Cart + Buy Now — all disabled when out of stock */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F5EEE6', borderRadius: 99, flexShrink: 0, opacity: outOfStock ? 0.5 : 1 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={outOfStock} aria-label="Decrease quantity" style={{ width: 38, height: 46, border: 'none', background: 'none', cursor: outOfStock ? 'default' : 'pointer', fontSize: 18, color: '#6B4F3A' }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 26, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Number.isFinite(stock) ? Math.min(stock, q + 1) : q + 1)} disabled={outOfStock} aria-label="Increase quantity" style={{ width: 38, height: 46, border: 'none', background: 'none', cursor: outOfStock ? 'default' : 'pointer', fontSize: 18, color: '#6B4F3A' }}>+</button>
              </div>
              <button onClick={handleAdd} disabled={outOfStock} style={{ flex: 1, padding: '13px 16px', borderRadius: 99, border: 'none', background: outOfStock ? '#EDE4D8' : addedFlash ? '#7A9A6B' : TC, color: outOfStock ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 14, cursor: outOfStock ? 'default' : 'pointer', transition: 'background 0.3s', minHeight: 46 }}>
                {outOfStock ? 'Out of Stock' : addedFlash ? '✓ Added!' : 'Add to Cart'}
              </button>
              {!outOfStock && (
                <button onClick={() => { for (let i = 0; i < qty; i++) dispatch(addLocal(product)); dispatch(clearActiveProduct()); dispatch(openCart()) }}
                  style={{ flex: 1, padding: '13px 16px', borderRadius: 99, border: 'none', background: `linear-gradient(135deg, ${TC}, #A85A38)`, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', minHeight: 46, boxShadow: '0 4px 12px rgba(196,112,74,0.35)' }}>
                  Buy Now
                </button>
              )}
            </div>

            {/* Shipping trust badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: 'white', borderRadius: 16, border: '1px solid #EDE4D8', marginBottom: 24 }}>
              {/* Return copy must match the seeded Return policy (14-day window). */}
              {[['🚚', 'Free delivery', 'on orders above ₹999'], ['💌', 'Gift wrapping', 'available at checkout'], ['↩️', 'Easy returns', '14-day return window on eligible items'], ['🔒', 'Secure checkout', 'SSL encrypted payment']].map(([e, t, s]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{e}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2C1A0E' }}>{t}</div>
                    <div style={{ fontSize: 11, color: '#9C7A63' }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: isMobile ? '0 20px' : '0 36px', borderTop: isMobile ? '8px solid #F5EEE6' : 'none' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #EDE4D8', overflowX: 'auto', scrollbarWidth: 'none', marginTop: isMobile ? 24 : 0 }} className="no-scrollbar">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: isMobile ? '12px 14px' : '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: isMobile ? 12 : 13, fontWeight: 600, color: activeTab === t.key ? TC : '#9C7A63', borderBottom: activeTab === t.key ? `2px solid ${TC}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: isMobile ? '20px 0' : '24px 0 32px' }}>
            {activeTab === 'description' && <TabContent value={product.description} />}
            {activeTab === 'materials' && <TabContent value={product.materials} />}
            {activeTab === 'care' && <TabContent value={product.care} />}
            {activeTab === 'shipping' && <TabContent value={product.shippingAndReturns} />}
            {activeTab === 'reviews' && (
              <div style={{ maxWidth: 700 }}>
                {/* Rating overview — only shown when there are reviews */}
                {reviews.length > 0 && (
                  <div style={{ display: 'flex', gap: isMobile ? 20 : 40, alignItems: 'center', padding: '20px', background: 'white', borderRadius: 18, border: '1px solid #EDE4D8', marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 700, color: TC, lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
                      <StarRating rating={avgRating} size={16} />
                      <div style={{ fontSize: 12, color: '#9C7A63', marginTop: 4 }}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      {ratingDist.map(({ n, count }) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#9C7A63', width: 8, textAlign: 'right', flexShrink: 0 }}>{n}</span>
                          <span style={{ color: TC, fontSize: 12 }}>★</span>
                          <div style={{ flex: 1, height: 6, background: '#EDE4D8', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(count / reviews.length) * 100}%`, background: TC, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#9C7A63', width: 14, textAlign: 'right' }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Write a Review form — isLoggedIn guard covers logout while the modal is open */}
                {isLoggedIn && canReview && !submitDone && (
                  <form onSubmit={handleSubmitReview} style={{ background: 'white', borderRadius: 18, padding: '20px 22px', border: `1px solid ${TC}33`, marginBottom: 24 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontWeight: 700, color: '#2C1A0E', marginBottom: 14 }}>Write a Review</div>
                    {/* Star picker */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button"
                          onClick={() => setReviewRating(n)}
                          onMouseEnter={() => setReviewHover(n)}
                          onMouseLeave={() => setReviewHover(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 26, color: n <= (reviewHover || reviewRating) ? TC : '#E5DBCC', transition: 'color 0.15s' }}>★</button>
                      ))}
                    </div>
                    <textarea
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      placeholder="Share your experience with this product (at least 10 characters)…"
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={4}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #EDE4D8', fontSize: 13, color: '#2C1A0E', fontFamily: 'DM Sans, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: '#FAF7F2' }}
                    />
                    {submitError && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 8 }}>{submitError}</div>}
                    <button type="submit" disabled={submitLoading}
                      style={{ marginTop: 12, padding: '11px 28px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 13, cursor: submitLoading ? 'default' : 'pointer', opacity: submitLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
                      {submitLoading ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {submitDone && (
                  <div style={{ background: '#EAF2E8', borderRadius: 14, padding: '14px 18px', marginBottom: 24, fontSize: 13, color: '#2A7A3B', fontWeight: 600 }}>
                    ✓ Your review has been submitted. Thank you!
                  </div>
                )}

                {/* Prompt to log in if not authenticated */}
                {!isLoggedIn && (
                  <div style={{ background: 'white', borderRadius: 14, padding: '14px 18px', marginBottom: 24, border: '1px solid #EDE4D8', fontSize: 13, color: '#6B4F3A' }}>
                    <span onClick={() => dispatch(openLogin())} style={{ color: TC, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign in</span> and purchase this product to leave a review.
                  </div>
                )}

                {/* Review cards */}
                {reviewsLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[1,2,3].map(i => <div key={i} style={{ height: 96, borderRadius: 16, background: '#EDE4D8', animation: 'skShimmer 1.4s infinite' }} />)}
                  </div>
                )}
                {!reviewsLoading && reviews.length === 0 && (
                  <div style={{ fontSize: 14, color: '#9C7A63', fontStyle: 'italic', lineHeight: 1.8 }}>No reviews yet. Be the first to review this product!</div>
                )}
                {!reviewsLoading && reviews.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #EDE4D8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>{r.userName.charAt(0).toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#2C1A0E', fontSize: 13 }}>{r.userName} <span style={{ fontSize: 10, color: '#7A9A6B', fontWeight: 600 }}>✓ Verified Purchase</span></div>
                              <div style={{ fontSize: 11, color: '#9C7A63' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                          </div>
                          <StarRating rating={r.rating} size={13} />
                        </div>
                        <p style={{ fontFamily: "'Lora',serif", fontSize: 13, color: '#6B4F3A', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.body}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similar.length > 0 && (
          <div style={{ padding: isMobile ? '0 20px 32px' : '0 36px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>More like this</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#2C1A0E' }}>Similar Products</h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => scrollCarousel(similarRef, -1)} aria-label="Scroll left" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #EDE4D8', background: 'white', cursor: 'pointer', fontSize: 14 }}>←</button>
                <button onClick={() => scrollCarousel(similarRef, 1)} aria-label="Scroll right" style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: TC, color: 'white', cursor: 'pointer', fontSize: 14 }}>→</button>
              </div>
            </div>
            <div ref={similarRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', paddingBottom: 4 }} className="no-scrollbar">
              {similar.map(p => <MiniCard key={p.id} p={p} />)}
            </div>
          </div>
        )}

        {/* You May Also Like */}
        {alsoLike.length > 0 && (
          <div style={{ padding: isMobile ? '0 20px 40px' : '0 36px 48px', borderTop: '1px solid #EDE4D8', paddingTop: isMobile ? 28 : 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Explore more</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#2C1A0E' }}>You May Also Like</h3>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', paddingBottom: 4 }} className="no-scrollbar">
              {alsoLike.map(p => <MiniCard key={p.id} p={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
