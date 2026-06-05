import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectProducts, selectProductsLoading } from '../store/slices/productsSlice'
import { selectWishlistIds, toggleWishlist } from '../store/slices/wishlistSlice'
import { addLocal } from '../store/slices/cartSlice'
import { selectUI, selectCartOpen, selectWishlistOpen, openBoxBuilder, openOccasions, openSearch, openUserAccount, openLogin, openWishlist, setActiveProduct, setActiveOccasion, setPersonalizationProduct } from '../store/slices/uiSlice'
import { selectIsLoggedIn, selectUser } from '../store/slices/authSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'
import Hero from '../components/Hero'
import ProductCard, { ProductSkeleton } from '../components/ui/ProductCard'

const TC = '#C4704A'

const TESTIMONIALS = [
  { name: 'Priya N.', location: 'Mumbai', rating: 5, text: "The gift box I built for my mum's birthday was perfect. She cried when she opened it — in the best way possible. The packaging alone is worth it.", occasion: "Mother's Day", avatar: 'P' },
  { name: 'James W.', location: 'London', rating: 5, text: "I've ordered three times now. The quality is genuinely handcrafted — you can feel the care in every piece. My anniversary gift was a huge hit.", occasion: 'Anniversary', avatar: 'J' },
  { name: 'Sofia B.', location: 'Paris',  rating: 5, text: 'Ordered for a wedding gift. The personal message card, the ribbon choice, the wrapping — every detail was stunning. Will be back for sure.', occasion: 'Wedding', avatar: 'S' },
]

function TestimonialCard({ t }) {
  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #EDE4D8', boxShadow: '0 2px 12px rgba(44,26,14,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: t.rating }).map((_, j) => <span key={j} style={{ color: TC, fontSize: 14 }}>★</span>)}
      </div>
      <p style={{ fontFamily: "'Lora',serif", fontSize: 14, color: '#6B4F3A', lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>"{t.text}"</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: TC, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
        <div>
          <div style={{ fontWeight: 700, color: '#2C1A0E', fontSize: 13 }}>{t.name}</div>
          <div style={{ fontSize: 11, color: '#9C7A63' }}>{t.location} · {t.occasion}</div>
        </div>
      </div>
    </div>
  )
}

function TestimonialsSection({ isMobile, isTablet }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!isMobile || paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 3500)
    return () => clearInterval(t)
  }, [isMobile, paused])

  return (
    <section style={{ padding: isMobile ? '56px 0' : isTablet ? '64px 32px' : '80px 48px' }}>
      <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52, padding: isMobile ? '0 20px' : 0 }}>
        <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Real Stories</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700 }}>Loved by Gift-Givers</h2>
      </div>

      {!isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : 'repeat(3,1fr)', gap: 24 }}>
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} t={t} />)}
        </div>
      ) : (
        <div>
          <div style={{ overflow: 'hidden', padding: '4px 20px 8px' }}>
            <div style={{ display: 'flex', transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)', transform: `translateX(-${idx * 100}%)` }}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} style={{ flexShrink: 0, width: '100%' }}
                  onMouseEnter={() => setPaused(true)}
                  onMouseLeave={() => setPaused(false)}>
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => { setIdx(i); setPaused(true); setTimeout(() => setPaused(false), 4000) }}
                style={{ width: i === idx ? 22 : 7, height: 7, borderRadius: 99, border: 'none', background: i === idx ? TC : '#D9CBBF', cursor: 'pointer', padding: 0, transition: 'all 0.35s ease' }} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

const OCCASIONS = [
  { id:'mothers',      title:"Mother's Day",  sub:'Thoughtful gifts made with love', icon:'💐', color:'#F0D5DC', featured:true, season:'May' },
  { id:'valentines',   title:"Valentine's Day",sub:'Speak love through craft',        icon:'💝', color:'#E8C5C5' },
  { id:'birthday',     title:'Birthday Gifts', sub:'Make birthdays unforgettable',    icon:'🎂', color:'#E8D5C4' },
  { id:'anniversary',  title:'Anniversary',    sub:'Celebrate years of love',         icon:'💍', color:'#E0D5C5' },
  { id:'wedding',      title:'Wedding',        sub:'For the start of forever',        icon:'💒', color:'#F2EAE0' },
  { id:'baby',         title:'Baby Shower',    sub:'Soft welcomes for tiny humans',   icon:'🍼', color:'#D8E4DC' },
  { id:'graduation',   title:'Graduation',     sub:'Mark the milestone',              icon:'🎓', color:'#D4C5B5' },
  { id:'friendship',   title:'Friendship',     sub:'For your favorite person',        icon:'🌻', color:'#EDD8B0' },
  { id:'christmas',    title:'Christmas',      sub:'Wrapped in warmth & wonder',      icon:'🎄', color:'#C8DBC4' },
  { id:'newyear',      title:'New Year',       sub:'Fresh starts, beautiful gifts',   icon:'✨', color:'#E4D8B0' },
  { id:'housewarming', title:'Housewarming',   sub:'Welcome home, with love',         icon:'🏡', color:'#E0CFB8' },
  { id:'thankyou',     title:'Thank You',      sub:'Gratitude, beautifully said',     icon:'🌷', color:'#E8D0C8' },
  { id:'him',          title:'For Him',        sub:'Crafted for the modern man',      icon:'🥃', color:'#C4D0C0' },
  { id:'her',          title:'For Her',        sub:'Refined, romantic, real',         icon:'🌹', color:'#F0D5DC' },
  { id:'kids',         title:'For Kids',       sub:'Joy, in every detail',            icon:'🧸', color:'#D4C0D0' },
  { id:'corporate',   title:'Corporate Gifts', sub:'Premium, thoughtful, on-brand',  icon:'🎁', color:'#D9CFC2' },
  { id:'fathers',      title:"Father's Day",   sub:'Honor him in style',              icon:'🎩', color:'#C8B89A' },
]

export default function HomePage() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const loading = useSelector(selectProductsLoading)
  const wishlistIds = useSelector(selectWishlistIds)
  const ui = useSelector(selectUI)
  const cartOpen = useSelector(selectCartOpen)
  const wishlistOpen = useSelector(selectWishlistOpen)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const user = useSelector(selectUser)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024
  const px = isMobile ? '20px' : isTablet ? '32px' : '48px'
  const carouselRef = useRef(null)
  const [activeRecipient, setActiveRecipient] = useState('all')
  const [activeCategory, setActiveCategory] = useState('All')
  const [emailVal, setEmailVal] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map(p => p.category)))],
    [products]
  )

  const filtered = useMemo(
    () => products.filter(p => {
      const matchRecipient = activeRecipient === 'all' || p.recipient === activeRecipient
      const matchCategory = activeCategory === 'All' || p.category === activeCategory
      return matchRecipient && matchCategory
    }),
    [products, activeRecipient, activeCategory]
  )

  const bestsellers = useMemo(
    () => products.filter(p => p.tag === 'Bestseller'),
    [products]
  )

  // Stable shuffle: seeded by products length so it only re-randomises when the product list changes
  const recommended = useMemo(() => {
    const copy = [...products]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor((i + 1) * 0.37)  // deterministic-ish, no random re-renders
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, 4)
  }, [products])

  const scrollTo = id => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
  }

  const scrollCarousel = dir => {
    carouselRef.current?.scrollBy({ left: dir * (isMobile ? 180 : 280), behavior: 'smooth' })
  }

  const handleAddToCart = useCallback(p => { dispatch(addLocal(p)) }, [dispatch])

  // Featured occasion
  const featuredOcc = OCCASIONS.find(o => o.featured) || OCCASIONS[1]
  const restOcc = OCCASIONS.filter(o => !o.featured)

  return (
    <>
      <Hero onScrollTo={scrollTo} />

      {/* ── SHOP BY RECIPIENT ─────────────────────────────── */}
      <section style={{ padding: isMobile ? '48px 20px' : isTablet ? '60px 32px' : '72px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Find the Perfect Gift</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, marginBottom: 28 }}>Shop by Recipient</h2>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 12, maxWidth: 700, margin: '0 auto' }}>
          {[
            { key: 'all',  label: 'Everyone', emoji: '🌟', bg: '#F5EEE6', count: products.length },
            { key: 'her',  label: 'For Her',  emoji: '🌸', bg: '#F5E8E8', count: products.filter(p => p.recipient === 'her').length },
            { key: 'him',  label: 'For Him',  emoji: '🍂', bg: '#E8F0E8', count: products.filter(p => p.recipient === 'him').length },
            { key: 'kids', label: 'For Kids', emoji: '🌈', bg: '#E8E8F5', count: products.filter(p => p.recipient === 'kids').length },
          ].map(r => (
            <button key={r.key} onClick={() => setActiveRecipient(r.key)}
              style={{ padding: isMobile ? '16px 12px' : '20px 24px', borderRadius: 20, border: '2px solid', borderColor: activeRecipient === r.key ? TC : '#EDE4D8', background: activeRecipient === r.key ? r.bg : 'white', cursor: 'pointer', transition: 'all 0.2s', transform: activeRecipient === r.key ? 'scale(1.04)' : 'none', minHeight: 44 }}>
              <div style={{ fontSize: isMobile ? 28 : 32, marginBottom: 6 }}>{r.emoji}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 16, fontWeight: 600, color: '#2C1A0E' }}>{r.label}</div>
              <div style={{ fontSize: 11, color: '#9C7A63', marginTop: 2 }}>{r.count} gifts</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FEATURED COLLECTION ───────────────────────────── */}
      <section id="featured-collection" style={{ padding: isMobile ? `0 20px 56px` : `0 ${px} 80px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              {activeRecipient === 'all' ? 'All Products' : activeRecipient === 'her' ? 'For Her' : activeRecipient === 'him' ? 'For Him' : 'For Kids'}
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Featured Collection</h2>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); setActiveRecipient('all'); setActiveCategory('All') }}
            style={{ color: TC, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>View all →</a>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 600, background: activeCategory === cat ? TC : '#F5EEE6', color: activeCategory === cat ? 'white' : '#6B4F3A', transition: 'all 0.18s', whiteSpace: 'nowrap', boxShadow: activeCategory === cat ? '0 4px 12px rgba(196,112,74,0.25)' : 'none' }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(auto-fill, minmax(200px,1fr))', gap: isMobile ? 12 : 20 }}>
          {loading ? Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => <ProductSkeleton key={i} />) :
            filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onClick={() => dispatch(setActiveProduct(p))} wishlisted={wishlistIds.includes(p.id)} onWishlist={id => dispatch(toggleWishlist(id))} />)}
        </div>
      </section>

      {/* ── GIFT BOX CTA BANNER ───────────────────────────── */}
      <section style={{ margin: isMobile ? '0 20px 56px' : `0 ${px} 80px`, borderRadius: isMobile ? 20 : 28, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, padding: isMobile ? '40px 24px' : isTablet ? '48px 48px' : '64px 72px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 24 : 48 }}>
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75, marginBottom: 10 }}>New Feature ✦</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(22px,6vw,32px)' : 'clamp(28px,4vw,42px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 14 }}>Build a Gift Box <br /><em>They'll Never Forget</em></h2>
            <p style={{ opacity: 0.85, fontSize: isMobile ? 14 : 16, lineHeight: 1.65, marginBottom: 24, maxWidth: 420 }}>Mix and match handcrafted items, add a personal note, choose a ribbon — we'll wrap it all beautifully.</p>
            <button onClick={() => dispatch(openBoxBuilder())} style={{ padding: '14px 30px', borderRadius: 99, background: 'white', color: TC, fontWeight: 700, fontSize: isMobile ? 14 : 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minHeight: 48 }}>Start Building →</button>
          </div>
          {!isMobile && <div style={{ fontSize: 100, flexShrink: 0, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.25))' }}>🎁</div>}
        </div>
      </section>

      {/* ── BESTSELLERS CAROUSEL ──────────────────────────── */}
      <section id="bestsellers" style={{ padding: isMobile ? `0 20px 56px` : `0 ${px} 80px` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Most Loved</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Best Sellers</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => scrollCarousel(-1)} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #EDE4D8', background: 'white', cursor: 'pointer', fontSize: 16 }}>←</button>
            <button onClick={() => scrollCarousel(1)} style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: TC, color: 'white', cursor: 'pointer', fontSize: 16 }}>→</button>
          </div>
        </div>
        <div ref={carouselRef} className="no-scrollbar" style={{ display: 'flex', gap: isMobile ? 12 : 20, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8 }}>
          {bestsellers.concat(bestsellers).map((p, i) => (
            <div key={i} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: isMobile ? 170 : 220 }}>
              <ProductCard product={p} onAddToCart={handleAddToCart} onClick={() => dispatch(setActiveProduct(p))} wishlisted={wishlistIds.includes(p.id)} onWishlist={id => dispatch(toggleWishlist(id))} />
            </div>
          ))}
        </div>
      </section>

      {/* ── OCCASIONS ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '48px 20px 56px' : isTablet ? '60px 32px 72px' : '72px 48px 96px', background: '#FAF7F2' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 28 : 36 }}>
          <div>
            <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Browse by Moment</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.1 }}>Gifts for Every Occasion</h2>
          </div>
          {!isMobile && (
            <button onClick={() => dispatch(openOccasions())} style={{ padding: '11px 22px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Browse All {OCCASIONS.length} →
            </button>
          )}
        </div>

        {/* Featured occasion card */}
        <div style={{ marginBottom: isMobile ? 28 : 32 }}>
          <div onClick={() => dispatch(setActiveOccasion(featuredOcc))}
            style={{ background: `linear-gradient(130deg, ${featuredOcc.color} 0%, #FAF7F2 70%)`, borderRadius: isMobile ? 20 : 28, padding: isMobile ? '28px 24px' : '44px 56px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 20 : 48, cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 16px 48px rgba(44,26,14,0.12)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 99, padding: '5px 12px', fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                ✦ Featured this {featuredOcc.season || 'season'}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 28 : 44, fontWeight: 700, lineHeight: 1.05, color: '#2C1A0E', marginBottom: 12 }}>{featuredOcc.title}</h3>
              <p style={{ fontSize: isMobile ? 14 : 16, color: '#6B4F3A', lineHeight: 1.65, marginBottom: 22, maxWidth: 440 }}>
                {featuredOcc.sub}. Hand-picked and hand-wrapped, ready to make someone feel truly cherished.
              </p>
              <button onClick={e => { e.stopPropagation(); dispatch(setActiveOccasion(featuredOcc)) }}
                style={{ padding: isMobile ? '12px 24px' : '13px 28px', borderRadius: 99, border: 'none', background: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}>
                Shop the Edit →
              </button>
            </div>
            <div style={{ fontSize: isMobile ? 100 : 160, lineHeight: 1, flexShrink: 0, animation: 'float 3.5s ease-in-out infinite', filter: 'drop-shadow(0 12px 28px rgba(44,26,14,0.12))' }}>
              {featuredOcc.icon}
            </div>
            <div style={{ position: 'absolute', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#2C1A0E', letterSpacing: '0.06em' }}>
              Limited Edit
            </div>
          </div>
        </div>

        {/* Occasions scroll: portrait-ratio cards, icon top-right, text bottom-left */}
        <div style={{ display: 'flex', gap: isMobile ? 12 : 16, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }} className="no-scrollbar">
          {restOcc.map(o => (
            <button key={o.id} onClick={() => dispatch(setActiveOccasion(o))}
              style={{ flexShrink: 0, width: isMobile ? 148 : 192, aspectRatio: '3/3.6', background: o.color, borderRadius: isMobile ? 16 : 20, border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden', scrollSnapAlign: 'start', padding: 0, transition: 'transform 0.3s cubic-bezier(.2,.9,.3,1.4), box-shadow 0.3s', textAlign: 'left', boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(44,26,14,0.16)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(44,26,14,0.06)' }}>
              <div style={{ position: 'absolute', top: isMobile ? 12 : 16, right: isMobile ? 12 : 16, fontSize: isMobile ? 40 : 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(44,26,14,0.1))' }}>{o.icon}</div>
              <div style={{ position: 'absolute', bottom: isMobile ? 14 : 20, left: isMobile ? 14 : 18, right: isMobile ? 14 : 18 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.2, marginBottom: 3 }}>{o.title}</div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: '#6B4F3A', lineHeight: 1.4 }}>{o.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {isMobile && (
          <div style={{ padding: '24px 0 0', textAlign: 'center' }}>
            <button onClick={() => dispatch(openOccasions())} style={{ padding: '13px 28px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}>
              Browse All {OCCASIONS.length} Occasions →
            </button>
          </div>
        )}
      </section>

      {/* ── RECOMMENDED FOR YOU ───────────────────────────── */}
      <section style={{ padding: isMobile ? '0 20px 56px' : `0 ${px} 80px` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Picked for you</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Recommended For You</h2>
          </div>
          <button onClick={() => isLoggedIn ? dispatch(openUserAccount()) : dispatch(openLogin())} style={{ padding: '8px 18px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>My Wishlist →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 20 }}>
          {loading ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />) :
            recommended.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => dispatch(setActiveProduct(p))}
                onAddToCart={handleAddToCart}
                wishlisted={wishlistIds.includes(p.id)}
                onWishlist={(id) => dispatch(toggleWishlist(id))}
              />
            ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 20px' : isTablet ? '64px 32px' : '80px 48px', background: '#F5EEE6' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 56 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Simple & Joyful</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700 }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 24 : 32, maxWidth: 900, margin: '0 auto' }}>
          {[
            { n: '01', title: 'Browse & Pick',    desc: 'Discover handcrafted treasures from artisans worldwide',        emoji: '🛍️' },
            { n: '02', title: 'Build Your Box',   desc: 'Drag items into your box, pick a ribbon color',                 emoji: '🎁' },
            { n: '03', title: 'Write Your Heart', desc: 'Add a message printed on a card inside',                       emoji: '💌' },
            { n: '04', title: 'We Deliver Joy',   desc: 'Arrives in eco-friendly packaging, ready to unwrap',           emoji: '🌿' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 32 : 40, marginBottom: 12 }}>{s.emoji}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: TC, marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 17, fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: isMobile ? 12 : 14, color: '#6B4F3A', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <TestimonialsSection isMobile={isMobile} isTablet={isTablet} />

      {/* ── NEWSLETTER ────────────────────────────────────── */}
      <section style={{ margin: isMobile ? '0 20px 56px' : `0 ${px} 80px`, borderRadius: isMobile ? 20 : 28, overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, padding: isMobile ? '40px 24px' : '56px 64px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 28 : 48 }}>
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>✦ Stay in the loop</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 'clamp(22px,5vw,30px)' : 'clamp(26px,3vw,38px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>Gifts, Stories &<br />Handcrafted Finds</h2>
            <p style={{ fontSize: isMobile ? 13 : 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', maxWidth: 360 }}>Join 12,000+ gift-givers who get early access to new collections, seasonal guides, and exclusive offers.</p>
          </div>
          <div style={{ flex: 1, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
              <input type="email" value={emailVal} onChange={e => setEmailVal(e.target.value)} placeholder="your@email.com"
                style={{ flex: 1, padding: '14px 18px', borderRadius: 99, border: 'none', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(4px)' }}
                onFocus={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                onBlur={e => e.target.style.background = 'rgba(255,255,255,0.1)'} />
              <button onClick={() => { if (!emailVal.includes('@')) return; setSubscribed(true); setTimeout(() => setSubscribed(false), 2500) }}
                style={{ padding: '14px 28px', borderRadius: 99, border: 'none', background: subscribed ? '#7A9A6B' : 'white', color: subscribed ? 'white' : TC, fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 6px 20px rgba(44,26,14,0.18)', transition: 'background 0.3s, color 0.3s' }}>
                {subscribed ? 'Subscribed ✓' : 'Subscribe →'}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>No spam, unsubscribe anytime. We respect your inbox.</div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ background: `linear-gradient(135deg, ${TC} 0%, #A85A38 100%)`, color: 'rgba(255,255,255,0.85)', padding: isMobile ? '40px 20px 32px' : '60px 48px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? 28 : 40, marginBottom: isMobile ? 32 : 48 }}>
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 10 }}>
              Prettycrafted
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', maxWidth: 260 }}>Prettycrafted — curating handcrafted gifts that carry warmth, intention, and love.</p>
          </div>
          {[
            { title: 'Shop',
              links:   ['Handmade Jewelry', 'Candles & Scents', 'Ceramics', 'Art Prints', 'Skincare', 'Gift Boxes'],
              hrefs:   ['/shop', '/shop', '/shop', '/shop', '/shop', '/gift-boxes'],
              actions: [() => scrollTo('featured-collection'), () => scrollTo('featured-collection'), () => scrollTo('featured-collection'), () => scrollTo('featured-collection'), () => scrollTo('featured-collection'), () => dispatch(openBoxBuilder())] },
            { title: 'Gifting',
              links:   ['Gift Box Builder', 'Occasions', 'For Her', 'For Him', 'For Kids'],
              hrefs:   ['/gift-boxes', '/occasions', '/shop', '/shop', '/shop'],
              actions: [() => dispatch(openBoxBuilder()), () => dispatch(openOccasions()), () => { setActiveRecipient('her'); scrollTo('featured-collection') }, () => { setActiveRecipient('him'); scrollTo('featured-collection') }, () => { setActiveRecipient('kids'); scrollTo('featured-collection') }] },
            { title: 'Company',
              links:   ['About Us', 'Artisans', 'Sustainability', 'Press'],
              hrefs:   ['/', '/', '/', '/'],
              actions: [] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white', marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map((l, li) => (
                  <a key={l} href={col.hrefs[li]} onClick={e => { e.preventDefault(); col.actions[li]?.() }}
                    style={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'white'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.78)'}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>© 2026 Prettycrafted. Made with ♥</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Shipping', href: '#' }].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── FLOATING BUILD GIFT BOX CTA (mobile only) ── exactly matches design */}
      {isMobile && !ui.showBoxBuilder && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 150, pointerEvents: 'auto' }}>
          <button onClick={() => dispatch(openBoxBuilder())} style={{ padding: '14px 28px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 24px rgba(196,112,74,0.5)', whiteSpace: 'nowrap', minHeight: 50 }}>🎁 Build Gift Box</button>
        </div>
      )}

    </>
  )
}
