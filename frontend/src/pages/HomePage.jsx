import { useRef, useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectProducts, selectProductsLoading, selectHampers } from '../store/slices/productsSlice'
import { selectUI, openBoxBuilder, openUserAccount, openLogin, openHamperShop, openShop, setActiveProduct, setActiveOccasion } from '../store/slices/uiSlice'
import { selectIsLoggedIn } from '../store/slices/authSlice'
import { useWindowWidth } from '../hooks/useWindowWidth'
import Hero from '../components/Hero'
import ProductCard, { ProductSkeleton } from '../components/ui/ProductCard'
import { useProductFilters, ProductFilterBar } from '../components/ui/ProductFilters'

const TC = '#C4704A'

const OCCASIONS = [
  { id:'mothers',      title:"Mother's Day",  sub:'Thoughtful gifts made with love', icon:'💐', iconImg:'/occasions/mothers-day.svg', color:'#F0D5DC', featured:true, season:'May' },
  { id:'valentines',   title:"Valentine's Day",sub:'Speak love through craft',        icon:'💝', iconImg:'/occasions/valentines-day.svg', color:'#E8C5C5' },
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
  const ui = useSelector(selectUI)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const hampers = useSelector(selectHampers)
  const ww = useWindowWidth()
  const isMobile = ww < 640
  const isTablet = ww >= 640 && ww < 1024
  const px = isMobile ? '20px' : isTablet ? '32px' : '48px'
  const carouselRef = useRef(null)
  const [activeRecipient, setActiveRecipient] = useState('all')
  const [emailVal, setEmailVal] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  // Featured Collection: recipient (from "Shop by Recipient") narrows the base,
  // then the shared count + sort + category-chip bar refines it.
  const recipientProducts = useMemo(
    () => products.filter(p => activeRecipient === 'all' || p.recipient === activeRecipient),
    [products, activeRecipient]
  )
  const {
    filters: featFilters, activeFilter: featFilter, setActiveFilter: setFeatFilter,
    sort: featSort, setSort: setFeatSort, sorted: featSorted,
  } = useProductFilters(recipientProducts)

  // Featured Collection shows a preview; "View all" opens the full shop page
  const featuredCap = 12

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

  // Featured occasion
  const featuredOcc = OCCASIONS.find(o => o.featured) || OCCASIONS[1]
  const restOcc = OCCASIONS.filter(o => !o.featured)

  return (
    <>
      
        
      
      <Hero />

      {/* ── FEATURED COLLECTION ───────────────────────────── */}
      <section id="featured-collection" style={{ padding: isMobile ? `0 20px 56px` : `0 ${px} 80px` }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            {activeRecipient === 'all' ? 'All Products' : activeRecipient === 'her' ? 'For Her' : activeRecipient === 'him' ? 'For Him' : 'For Kids'}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Featured Collection</h2>
          <div style={{ fontSize: 13, color: '#6B4F3A', fontWeight: 600, marginTop: 8 }}>{featSorted.length} Products</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <ProductFilterBar
            count={featSorted.length}
            filters={featFilters}
            activeFilter={featFilter}
            onFilter={setFeatFilter}
            sort={featSort}
            onSort={setFeatSort}
            chipsWrap={!isMobile}
            showCount={false}
            inlineSort
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(auto-fill, minmax(200px,1fr))', gap: isMobile ? 12 : 20 }}>
          {loading ? Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => <ProductSkeleton key={i} />) :
            featSorted.slice(0, featuredCap).map(p => <ProductCard key={p.id} product={p} onClick={() => dispatch(setActiveProduct(p))} />)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 32 : 40 }}>
          <button onClick={() => dispatch(openShop())}
            style={{ padding: isMobile ? '13px 32px' : '14px 38px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 12px rgba(44,26,14,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = TC; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,112,74,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = TC; e.currentTarget.style.boxShadow = '0 2px 12px rgba(44,26,14,0.06)' }}>
            View All Products →
          </button>
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
          {bestsellers.map(p => (
            <div key={p.id} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: isMobile ? 170 : 220 }}>
              <ProductCard product={p} onClick={() => dispatch(setActiveProduct(p))} />
            </div>
          ))}
        </div>
      </section>

      {/* ── OCCASIONS ─────────────────────────────────────── */}
      <section id="occasions" style={{ padding: isMobile ? '48px 20px 56px' : isTablet ? '60px 32px 72px' : '72px 48px 96px', background: '#FAF7F2' }}>
        <div style={{ marginBottom: isMobile ? 28 : 36 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Browse by Moment</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 26 : 36, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.1 }}>Gifts for Every Occasion</h2>
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
              {!isMobile && (
                <button onClick={e => { e.stopPropagation(); dispatch(setActiveOccasion(featuredOcc)) }}
                  style={{ padding: '13px 28px', borderRadius: 99, border: 'none', background: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}>
                  Shop the Edit →
                </button>
              )}
            </div>
            <div style={{ fontSize: isMobile ? 100 : 160, lineHeight: 1, flexShrink: 0, animation: 'float 3.5s ease-in-out infinite', filter: 'drop-shadow(0 12px 28px rgba(44,26,14,0.12))' }}>
              {featuredOcc.iconImg
                ? <img src={featuredOcc.iconImg} alt={featuredOcc.title} style={{ width: isMobile ? 160 : 260, height: 'auto', display: 'block' }} />
                : featuredOcc.icon}
            </div>
            {isMobile && (
              <button onClick={e => { e.stopPropagation(); dispatch(setActiveOccasion(featuredOcc)) }}
                style={{ padding: '12px 24px', borderRadius: 99, border: 'none', background: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(44,26,14,0.18)' }}>
                Shop the Edit →
              </button>
            )}
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
              <div style={{ position: 'absolute', top: isMobile ? 12 : 16, right: isMobile ? 12 : 16, fontSize: isMobile ? 40 : 52, lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(44,26,14,0.1))' }}>
                {o.iconImg
                  ? <img src={o.iconImg} alt={o.title} style={{ width: isMobile ? 64 : 84, height: 'auto', display: 'block' }} />
                  : o.icon}
              </div>
              <div style={{ position: 'absolute', bottom: isMobile ? 14 : 20, left: isMobile ? 14 : 18, right: isMobile ? 14 : 18 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#2C1A0E', lineHeight: 1.2, marginBottom: 3 }}>{o.title}</div>
                <div style={{ fontSize: isMobile ? 10 : 11, color: '#6B4F3A', lineHeight: 1.4 }}>{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── HAMPER FOR YOU ────────────────────────────────── */}
      <section id="hamper-for-you" style={{ padding: isMobile ? '0 20px 56px' : `0 ${px} 80px` }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Curated Collections</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 22 : 32, fontWeight: 700 }}>Hamper For You</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 12 : 20 }}>
          {hampers.slice(0, 4).map((h, i) => (
            <div key={h.id} style={{ animation: `fadeUp 0.5s ease ${i * 0.08}s backwards` }}>
              <ProductCard product={h} onClick={() => dispatch(setActiveProduct(h))} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: isMobile ? 32 : 40 }}>
          <button onClick={() => dispatch(openHamperShop())}
            style={{ padding: isMobile ? '13px 32px' : '14px 38px', borderRadius: 99, border: `1.5px solid ${TC}`, background: 'white', color: TC, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 12px rgba(44,26,14,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = TC; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(196,112,74,0.28)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = TC; e.currentTarget.style.boxShadow = '0 2px 12px rgba(44,26,14,0.06)' }}>
            Show All Hampers →
          </button>
        </div>
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
              hrefs:   ['/gift-boxes', '/#occasions', '/shop', '/shop', '/shop'],
              actions: [() => dispatch(openBoxBuilder()), () => scrollTo('occasions'), () => { setActiveRecipient('her'); scrollTo('featured-collection') }, () => { setActiveRecipient('him'); scrollTo('featured-collection') }, () => { setActiveRecipient('kids'); scrollTo('featured-collection') }] },
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
