import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearActiveProduct, setActiveProduct, openCart } from '../../store/slices/uiSlice'
import { addLocal } from '../../store/slices/cartSlice'
import { toggleWishlist } from '../../store/slices/wishlistSlice'
import { selectWishlistIds } from '../../store/slices/wishlistSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'
import { analytics } from '../../analytics'

const TC = '#C4704A'

function makeReviews(product) {
  const names = ['Aanya S.', 'Maya R.', 'Priya K.', 'Liam C.', 'Noah W.', 'Sofia M.', 'Arjun P.', 'Emma T.']
  const texts = [
    'Absolutely stunning craftsmanship! Even better than the photos.',
    'Beautiful packaging and the quality is top-notch. Worth every penny.',
    'Gifted this to my sister — she loved it. Will buy again.',
    'Lovely scent and the design feels really premium.',
    'Pretty as expected, though shipping took a little longer than I hoped.',
    'Fell in love the moment I opened it. So thoughtful.',
    'Great little detail — feels handmade and intentional.',
    'Five stars. The reviews don\'t lie!',
  ]
  const ratings = [5,5,4,5,4,5,5,5]
  return Array.from({ length: 6 }, (_, i) => ({
    name: names[(product.id + i) % names.length],
    rating: ratings[(product.id + i) % ratings.length],
    text: texts[(product.id + i) % texts.length],
    date: ['2 days ago','1 week ago','2 weeks ago','1 month ago','3 weeks ago','2 months ago'][i],
    verified: i % 2 === 0,
  }))
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
  const allProducts = useSelector(selectProducts)
  const wishlistIds = useSelector(selectWishlistIds)
  const ww = useWindowWidth()
  const isMobile = ww < 768
  const isWishlisted = wishlistIds.includes(product.id)

  useEffect(() => { analytics.productView(product) }, [product])

  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false })
  const [addedFlash, setAddedFlash] = useState(false)
  const galleryRef = useRef(null)
  const similarRef = useRef(null)
  const touchStartX = useRef(0)

  // Build 4-image gallery from same category
  const gallery = useMemo(() => {
    const sameCat = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3)
    return [product, ...sameCat]
  }, [product, allProducts])

  const reviews = useMemo(() => makeReviews(product), [product])
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const ratingDist = [5,4,3,2,1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }))

  const similar = useMemo(() => {
    const sameCat = allProducts.filter(p => p.id !== product.id && p.category === product.category)
    return sameCat.length > 0 ? sameCat.slice(0, 8) : allProducts.filter(p => p.id !== product.id).slice(0, 8)
  }, [product, allProducts])

  const alsoLike = useMemo(() => {
    return allProducts.filter(p => p.id !== product.id && p.category !== product.category).slice(0, 8)
  }, [product, allProducts])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') dispatch(clearActiveProduct()) }
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [dispatch])

  useEffect(() => { setQty(1); setActiveImage(0); setActiveTab('description') }, [product.id])

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

  const stockCount = 8 + (product.id % 5)
  const desc = `Handcrafted with love and intention, this ${product.name.toLowerCase()} brings warmth and beauty to any space. Each piece is thoughtfully made by independent artisans using traditional techniques and sustainable materials.`

  const TABS = [
    { key: 'description', label: 'Description' },
    { key: 'materials',   label: 'Materials'   },
    { key: 'care',        label: 'Care'         },
    { key: 'shipping',    label: 'Shipping'     },
    { key: 'reviews',     label: `Reviews (${reviews.length})` },
  ]

  const MiniCard = ({ p }) => (
    <div onClick={() => dispatch(setActiveProduct(p))}
      style={{ flexShrink: 0, width: isMobile ? 150 : 188, cursor: 'pointer', borderRadius: 16, overflow: 'hidden', background: 'white', border: '1px solid #EDE4D8', transition: 'transform 0.2s, box-shadow 0.2s', scrollSnapAlign: 'start' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(44,26,14,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ height: isMobile ? 110 : 140, background: p.bg||'#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, color: '#2C1A0E', marginBottom: 5, lineHeight: 1.3 }}>{p.name}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: TC, fontSize: 14 }}>₹{p.price}</span>
          <button onClick={e => { e.stopPropagation(); dispatch(addLocal(p)) }} style={{ padding: '4px 10px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && dispatch(clearActiveProduct())}
      style={{ alignItems: 'flex-start', padding: isMobile ? 0 : 20, overflowY: 'auto' }}>
      <div style={{ background: '#FAF7F2', width: '100%', maxWidth: 1080, borderRadius: isMobile ? 0 : 24, boxShadow: '0 32px 80px rgba(44,26,14,0.25)', overflow: 'hidden', marginTop: isMobile ? 0 : 20, marginBottom: isMobile ? 0 : 20, minHeight: isMobile ? '100vh' : 'auto' }}
        className="animate-fade-up">

        {/* Sticky top bar — breadcrumb + close */}
        <div style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(250,247,242,0.95)', backdropFilter: 'blur(8px)', padding: isMobile ? '14px 16px' : '16px 28px', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#9C7A63', display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => dispatch(clearActiveProduct())}>Home</span>
            <span>›</span>
            <span style={{ cursor: 'pointer' }} onClick={() => dispatch(clearActiveProduct())}>{product.category}</span>
            <span>›</span>
            <span style={{ color: '#2C1A0E', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
          </div>
          <button onClick={() => dispatch(clearActiveProduct())} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>×</button>
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
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 2 }}>
                <span style={{ background: '#2C1A0E', color: 'white', fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' }}>✦ Handmade</span>
                {product.tag && <span style={{ background: TC, color: 'white', fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 99, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{product.tag}</span>}
              </div>
              {/* Wishlist heart — top-right of gallery image */}
              <button onClick={() => dispatch(toggleWishlist(product.id))}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(44,26,14,0.12)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? TC : 'none'} stroke={TC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {gallery[activeImage].imageUrl ? (
                <img src={gallery[activeImage].imageUrl} alt={gallery[activeImage].name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: zoom.active ? `scale(1.5) translate(${(50 - zoom.x) * 0.4}%, ${(50 - zoom.y) * 0.4}%)` : 'scale(1)', transition: zoom.active ? 'transform 0.1s linear' : 'transform 0.3s ease', transformOrigin: `${zoom.x}% ${zoom.y}%` }} />
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
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div style={{ padding: isMobile ? '20px 20px 0' : '4px 0 0' }}>
            <div style={{ fontSize: 11, color: '#9C7A63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{product.category}</div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.15, marginBottom: 12 }}>{product.name}</h1>

            {/* Rating summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <StarRating rating={avgRating} size={15} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 13, color: '#9C7A63', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setActiveTab('reviews')}>({reviews.length} reviews)</span>
              <span style={{ fontSize: 12, color: '#7A9A6B', fontWeight: 600 }}>✓ In Stock ({stockCount} left)</span>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: TC }}>₹{product.price}</span>
              {product.originalPrice && <span style={{ fontSize: 16, color: '#B8A090', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>}
              {product.originalPrice && <span style={{ fontSize: 12, background: '#EAF2E8', color: '#2A7A3B', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Save {Math.round((1 - product.price / product.originalPrice) * 100)}%</span>}
            </div>

            {/* Handcrafted badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5EEE6', borderRadius: 99, padding: '7px 14px', fontSize: 12, color: '#6B4F3A', fontWeight: 600, marginBottom: 22 }}>🤲 Individually handcrafted · Each one unique</div>

            {/* Qty + Add to Cart + Buy Now */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F5EEE6', borderRadius: 99, flexShrink: 0 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 38, height: 46, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#6B4F3A' }}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 26, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 38, height: 46, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#6B4F3A' }}>+</button>
              </div>
              <button onClick={handleAdd} style={{ flex: 1, padding: '13px 16px', borderRadius: 99, border: 'none', background: addedFlash ? '#7A9A6B' : TC, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.3s', minHeight: 46 }}>
                {addedFlash ? '✓ Added!' : 'Add to Cart'}
              </button>
              <button onClick={() => { for (let i = 0; i < qty; i++) dispatch(addLocal(product)); dispatch(clearActiveProduct()); dispatch(openCart()) }}
                style={{ flex: 1, padding: '13px 16px', borderRadius: 99, border: 'none', background: `linear-gradient(135deg, ${TC}, #A85A38)`, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', minHeight: 46, boxShadow: '0 4px 12px rgba(196,112,74,0.35)' }}>
                Buy Now
              </button>
            </div>

            {/* Shipping trust badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', background: 'white', borderRadius: 16, border: '1px solid #EDE4D8', marginBottom: 24 }}>
              {[['🚚', 'Free shipping', 'on orders over $60'], ['💌', 'Gift wrapping', 'available at checkout'], ['↩️', 'Free returns', '30-day hassle-free returns'], ['🔒', 'Secure checkout', 'SSL encrypted payment']].map(([e, t, s]) => (
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
            {activeTab === 'description' && (
              <div style={{ fontSize: 14, color: '#6B4F3A', lineHeight: 1.8, maxWidth: 680 }}>
                <p style={{ marginBottom: 14 }}>{desc}</p>
                <p>The {product.name} is part of our curated {product.category.toLowerCase()} collection — a tribute to slow craft and timeless design. No two pieces are exactly alike; small variations celebrate the human touch behind every creation.</p>
              </div>
            )}
            {activeTab === 'materials' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
                {[['Primary material', 'Sustainably sourced natural materials'], ['Finish', 'Hand-applied, non-toxic treatment'], ['Dimensions', 'Standard (±5% handmade variation)'], ['Weight', 'Approx. 200–350g'], ['Origin', 'Made in India by independent artisans']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EDE4D8', fontSize: 13 }}>
                    <span style={{ color: '#9C7A63', fontWeight: 500 }}>{k}</span>
                    <span style={{ color: '#2C1A0E', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'care' && (
              <div style={{ fontSize: 14, color: '#6B4F3A', lineHeight: 1.8, maxWidth: 560 }}>
                <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Handle with care — each piece is handcrafted and unique.', 'Wipe clean with a soft, dry or slightly damp cloth.', 'Avoid prolonged exposure to direct sunlight.', 'Store in the provided box or wrap in tissue to maintain finish.', 'Do not use harsh chemicals or abrasive materials.'].map(c => <li key={c}>{c}</li>)}
                </ul>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
                {[['Standard Delivery', '3–5 business days', '$5.99 (free on orders $60+)'], ['Express Delivery', '1–2 business days', '$9.99'], ['Same-Day', 'Today by 8 PM', '$19.99 (select cities)'], ['Returns', '30-day free returns', 'No questions asked']].map(([t, eta, price]) => (
                  <div key={t} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'white', borderRadius: 14, border: '1px solid #EDE4D8' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#2C1A0E', fontSize: 13, marginBottom: 3 }}>{t}</div>
                      <div style={{ fontSize: 12, color: '#9C7A63' }}>{eta}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TC, flexShrink: 0 }}>{price}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div style={{ maxWidth: 700 }}>
                {/* Rating overview */}
                <div style={{ display: 'flex', gap: isMobile ? 20 : 40, alignItems: 'center', padding: '20px', background: 'white', borderRadius: 18, border: '1px solid #EDE4D8', marginBottom: 24, flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 700, color: TC, lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
                    <StarRating rating={avgRating} size={16} />
                    <div style={{ fontSize: 12, color: '#9C7A63', marginTop: 4 }}>{reviews.length} reviews</div>
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
                {/* Review cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.map((r, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 16, padding: '18px 20px', border: '1px solid #EDE4D8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>{r.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#2C1A0E', fontSize: 13 }}>{r.name} {r.verified && <span style={{ fontSize: 10, color: '#7A9A6B', fontWeight: 600 }}>✓ Verified</span>}</div>
                            <div style={{ fontSize: 11, color: '#9C7A63' }}>{r.date}</div>
                          </div>
                        </div>
                        <StarRating rating={r.rating} size={13} />
                      </div>
                      <p style={{ fontFamily: "'Lora',serif", fontSize: 13, color: '#6B4F3A', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.text}"</p>
                    </div>
                  ))}
                </div>
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
                <button onClick={() => scrollCarousel(similarRef, -1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #EDE4D8', background: 'white', cursor: 'pointer', fontSize: 14 }}>←</button>
                <button onClick={() => scrollCarousel(similarRef, 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: TC, color: 'white', cursor: 'pointer', fontSize: 14 }}>→</button>
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
  )
}
