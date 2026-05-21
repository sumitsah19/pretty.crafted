import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearActiveOccasion } from '../../store/slices/uiSlice'
import { selectWishlistIds, toggleWishlist } from '../../store/slices/wishlistSlice'
import { addLocal } from '../../store/slices/cartSlice'
import { productsApi } from '../../api/services'

const TC = '#C4704A'

// ── EXTENDED PRODUCT CATALOG ─────────────────────────────────────
const OC_PRODUCTS = [
  { id:101, name:'Wildflower Soy Candle',       category:'Candles & Scents',    price:28, originalPrice:35, rating:4.9, rc:247, emoji:'🕯️', bg:'#E8D5C4', tag:'Bestseller', hc:true,  occ:['birthday','mothers','valentines','friendship','thankyou','christmas'] },
  { id:102, name:'Pressed Botanicals Ring',      category:'Handmade Jewelry',    price:42,                  rating:4.8, rc:183, emoji:'💍', bg:'#D5E0CC', tag:'New',        hc:true,  occ:['anniversary','wedding','valentines','her','birthday'] },
  { id:103, name:'Stoneware Coffee Mug',         category:'Ceramics',            price:28, originalPrice:36, rating:4.7, rc:312, emoji:'☕', bg:'#D4C5B5', tag:'Bestseller', hc:true,  occ:['birthday','him','fathers','housewarming','friendship','corporate'] },
  { id:104, name:'Linen Watercolor Print',       category:'Art Prints',          price:48,                  rating:4.6, rc:89,  emoji:'🖼️', bg:'#E0D5C5', tag:'',           hc:true,  occ:['anniversary','wedding','housewarming','her','graduation'] },
  { id:105, name:'Rose Clay Face Mask Set',      category:'Skincare',            price:22, originalPrice:28, rating:4.8, rc:205, emoji:'🌹', bg:'#E8D0C8', tag:'New',        hc:true,  occ:['mothers','valentines','birthday','her','friendship'] },
  { id:106, name:'Leather-bound Journal',        category:'Books & Stationery',  price:38,                  rating:4.7, rc:156, emoji:'📔', bg:'#C8B89A', tag:'',           hc:true,  occ:['graduation','birthday','him','fathers','corporate'] },
  { id:107, name:'Wildberry Jam Set',            category:'Food & Gourmet',      price:32, originalPrice:40, rating:4.9, rc:134, emoji:'🫙', bg:'#D4C0D0', tag:'Bestseller', hc:false, occ:['christmas','housewarming','birthday','kids','him','thankyou'] },
  { id:108, name:'Mini Terrarium Kit',           category:'Plants',              price:45,                  rating:4.6, rc:78,  emoji:'🌱', bg:'#C8D8C0', tag:'New',        hc:false, occ:['baby','kids','housewarming','graduation','birthday'] },
  { id:109, name:'Cedar Beard Oil',              category:'Skincare',            price:26,                  rating:4.7, rc:93,  emoji:'🌲', bg:'#C4D0C0', tag:'',           hc:true,  occ:['him','fathers','birthday','christmas'] },
  { id:110, name:'Gold Vermeil Ear Cuff',        category:'Handmade Jewelry',    price:34, originalPrice:44, rating:4.9, rc:201, emoji:'✨', bg:'#E4D8B0', tag:'',           hc:true,  occ:['birthday','anniversary','her','valentines','wedding'] },
  { id:111, name:'Spiced Honey Gift Set',        category:'Food & Gourmet',      price:38,                  rating:4.8, rc:167, emoji:'🍯', bg:'#E0C890', tag:'Bestseller', hc:false, occ:['him','fathers','christmas','housewarming','thankyou','corporate'] },
  { id:112, name:'Fairy Light Terrarium',        category:'Plants',              price:52,                  rating:4.7, rc:62,  emoji:'🏮', bg:'#C0D4D0', tag:'',           hc:true,  occ:['baby','kids','wedding','birthday','housewarming'] },
  { id:113, name:'Hand-poured Beeswax Tapers',  category:'Candles & Scents',    price:24, originalPrice:30, rating:4.8, rc:89,  emoji:'🕯️', bg:'#EDE4C8', tag:'',           hc:true,  occ:['wedding','anniversary','christmas','housewarming'] },
  { id:114, name:'Ceramic Bud Vase Set',         category:'Ceramics',            price:36,                  rating:4.6, rc:114, emoji:'🏺', bg:'#E0D0B8', tag:'New',        hc:true,  occ:['mothers','wedding','anniversary','housewarming','her'] },
  { id:115, name:'Personalized Wax Seal Kit',    category:'Books & Stationery',  price:29,                  rating:4.9, rc:77,  emoji:'📜', bg:'#D8CCB8', tag:'New',        hc:false, occ:['wedding','graduation','anniversary','birthday'] },
  { id:116, name:"Baby's First Keepsake Box",    category:'Ceramics',            price:58,                  rating:5.0, rc:43,  emoji:'🎀', bg:'#EAD8E0', tag:'Bestseller', hc:true,  occ:['baby'] },
  { id:117, name:'Artisan Soap Collection',      category:'Skincare',            price:32, originalPrice:42, rating:4.7, rc:198, emoji:'🧼', bg:'#D8E4D8', tag:'',           hc:true,  occ:['mothers','her','birthday','friendship','housewarming','thankyou','corporate'] },
  { id:118, name:'Hand-knit Comfort Throw',      category:'Textiles',            price:68,                  rating:4.8, rc:55,  emoji:'🧶', bg:'#E8D8C4', tag:'New',        hc:true,  occ:['christmas','baby','housewarming','mothers'] },
  { id:119, name:'Copper Pour-over Coffee Set',  category:'Food & Gourmet',      price:62, originalPrice:78, rating:4.9, rc:88,  emoji:'☕', bg:'#C8B8A0', tag:'Bestseller', hc:false, occ:['him','fathers','housewarming','graduation','corporate'] },
  { id:120, name:'Dried Flower Arrangement',     category:'Plants',              price:44,                  rating:4.7, rc:121, emoji:'🌸', bg:'#F0D8E0', tag:'',           hc:true,  occ:['mothers','valentines','wedding','birthday','her','friendship'] },
  { id:121, name:'Crystal Ritual Set',           category:'Wellness',            price:56,                  rating:4.8, rc:67,  emoji:'💎', bg:'#D8D0E8', tag:'New',        hc:false, occ:['birthday','her','friendship','valentines'] },
  { id:122, name:'Kids Art Supply Kit',          category:'Toys & Crafts',       price:36, originalPrice:46, rating:4.9, rc:203, emoji:'🎨', bg:'#E8D8C0', tag:'Bestseller', hc:false, occ:['kids','birthday','christmas','graduation'] },
  { id:123, name:'Letterpress Card Set',         category:'Books & Stationery',  price:22,                  rating:4.8, rc:144, emoji:'💌', bg:'#E0CCB8', tag:'',           hc:true,  occ:['wedding','anniversary','birthday','thankyou','friendship'] },
  { id:124, name:'Aromatherapy Diffuser',        category:'Wellness',            price:48,                  rating:4.7, rc:176, emoji:'🌿', bg:'#D0DCC8', tag:'',           hc:false, occ:['mothers','housewarming','birthday','corporate','her'] },
]

// ── PER-OCCASION HERO CONFIG ─────────────────────────────────────
const OCC_CFG = {
  valentines:   { g:'linear-gradient(130deg,#F5D0D8 0%,#FAF7F2 65%)', e2:'🌹', e3:'💌', h:'Love, Handcrafted',            s:"Every stitch, pour, and petal says what words can't.", cta:'Shop Love Gifts' },
  mothers:      { g:'linear-gradient(130deg,#F0D5DC 0%,#FAF7F2 65%)', e2:'🌷', e3:'💐', h:'For the Heart of the Home',    s:'Celebrate her with gifts as thoughtful as she is.', cta:"Shop Mother's Day" },
  fathers:      { g:'linear-gradient(130deg,#C8D0C4 0%,#FAF7F2 65%)', e2:'☕', e3:'🥃', h:'For the Man Who Has It All',   s:'Curated for the modern gentleman — refined, real.', cta:"Shop Father's Day" },
  birthday:     { g:'linear-gradient(130deg,#E8D5C4 0%,#FAF7F2 65%)', e2:'🎉', e3:'✨', h:'Make It Unforgettable',        s:'Handcrafted gifts that turn birthdays into memories.', cta:'Shop Birthday Gifts' },
  anniversary:  { g:'linear-gradient(130deg,#E0D5C5 0%,#FAF7F2 65%)', e2:'💍', e3:'🌹', h:'Celebrate Years of Love',      s:'Mark every milestone with something beautifully made.', cta:'Shop Anniversary Gifts' },
  wedding:      { g:'linear-gradient(130deg,#F2EAE0 0%,#FAF7F2 65%)', e2:'💒', e3:'🥂', h:'For the Start of Forever',     s:'Exquisite gifts that honour the beginning of their story.', cta:'Shop Wedding Gifts' },
  baby:         { g:'linear-gradient(130deg,#D8E4DC 0%,#FAF7F2 65%)', e2:'🍼', e3:'🌿', h:'Welcome the Tiny Human',       s:'Soft, safe, and made with love for the newest arrival.', cta:'Shop Baby Gifts' },
  graduation:   { g:'linear-gradient(130deg,#D4C5B5 0%,#FAF7F2 65%)', e2:'🎓', e3:'⭐', h:'Mark the Milestone',           s:'Gifts that celebrate hard work, growth, and the road ahead.', cta:'Shop Graduation Gifts' },
  christmas:    { g:'linear-gradient(130deg,#C8DBC4 0%,#FAF7F2 65%)', e2:'🎄', e3:'❄️', h:'Wrapped in Warmth & Wonder',   s:'Handcrafted magic for the most wonderful time of year.', cta:'Shop Christmas Gifts' },
  housewarming: { g:'linear-gradient(130deg,#E0CFB8 0%,#FAF7F2 65%)', e2:'🏡', e3:'🕯️', h:'Welcome Home, with Love',      s:'Help them turn a house into a home with handcrafted warmth.', cta:'Shop Housewarming' },
  friendship:   { g:'linear-gradient(130deg,#EDD8B0 0%,#FAF7F2 65%)', e2:'🌻', e3:'💛', h:'For Your Favorite Person',     s:'Because some friendships deserve something truly special.', cta:'Shop Friendship Gifts' },
  him:          { g:'linear-gradient(130deg,#C4D0C0 0%,#FAF7F2 65%)', e2:'🥃', e3:'☕', h:'Crafted for the Modern Man',   s:'Refined, practical, and made with real intention.', cta:'Shop Gifts for Him' },
  her:          { g:'linear-gradient(130deg,#F0D5DC 0%,#FAF7F2 65%)', e2:'🌹', e3:'✨', h:'Refined, Romantic, Real',      s:'Everything she deserves — handpicked, handcrafted.', cta:'Shop Gifts for Her' },
  kids:         { g:'linear-gradient(130deg,#D4C0D0 0%,#FAF7F2 65%)', e2:'🧸', e3:'🌈', h:'Joy in Every Detail',          s:'Safe, beautiful, and made to spark wonder.', cta:'Shop Kids Gifts' },
  corporate:    { g:'linear-gradient(130deg,#D9CFC2 0%,#FAF7F2 65%)', e2:'🎁', e3:'⭐', h:'Premium, Thoughtful, On-Brand', s:'Gifts your team and clients will actually treasure.', cta:'Shop Corporate Gifts' },
  default:      { g:'linear-gradient(130deg,#EDE4D8 0%,#FAF7F2 65%)', e2:'🎁', e3:'✨', h:'Gifts Made with Heart',        s:'Discover handcrafted treasures curated for this moment.', cta:'Shop This Collection' },
}

// ── STARS ─────────────────────────────────────────────────────────
function OcStars({ rating, size = 12 }) {
  const full = Math.round(rating)
  return (
    <div style={{ display:'flex', gap:1, alignItems:'center' }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize:size, color: i <= full ? TC : '#D9CBBF', lineHeight:1 }}>★</span>)}
    </div>
  )
}

// ── SKELETON ──────────────────────────────────────────────────────
function OcSkeleton({ isMobile }) {
  const s = { background:'linear-gradient(90deg,#EDE4D8 25%,#E8DDD4 50%,#EDE4D8 75%)', backgroundSize:'400% 100%', animation:'ocShimmer 1.6s ease-in-out infinite', borderRadius:10 }
  return (
    <div style={{ background:'white', borderRadius:20, overflow:'hidden', border:'1px solid #EDE4D8' }}>
      <div style={{ ...s, height: isMobile ? 160 : 200 }} />
      <div style={{ padding: isMobile ? 14 : 18 }}>
        <div style={{ ...s, height:9, width:'55%', marginBottom:8 }} />
        <div style={{ ...s, height:13, marginBottom:6 }} />
        <div style={{ ...s, height:13, width:'75%', marginBottom:14 }} />
        <div style={{ ...s, height:18, width:'35%' }} />
      </div>
    </div>
  )
}

// ── OcCard — defined OUTSIDE the main component to avoid re-mount issues
function OcCard({ p, onPreview, wishlist, onWishlist, tc, isMobile, onAddToCart }) {
  const inWl = wishlist.has(p.id)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0
  const [added, setAdded] = useState(false)

  const handleAdd = e => {
    e.stopPropagation()
    onAddToCart(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div onClick={() => onPreview(p)}
      style={{ background:'white', borderRadius:20, overflow:'hidden', border:'1px solid #EDE4D8', cursor:'pointer', transition:'transform 0.3s cubic-bezier(.2,.9,.3,1.2), box-shadow 0.3s', position:'relative', display:'flex', flexDirection:'column' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(44,26,14,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ height: isMobile ? 155 : 195, background:p.bg||'#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 52 : 68, position:'relative', overflow:'hidden', flexShrink:0 }}>
        {disc > 0 && <div style={{ position:'absolute', top:10, left:10, background:'#7A9A6B', color:'white', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>-{disc}%</div>}
        {p.tag && <div style={{ position:'absolute', top:10, left: disc > 0 ? 52 : 10, background: p.tag === 'New' ? '#7A9A6B' : tc, color:'white', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>{p.tag}</div>}
        {p.hc && <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(255,255,255,0.88)', backdropFilter:'blur(4px)', fontSize:9, fontWeight:600, color:'#6B4F3A', padding:'3px 8px', borderRadius:99 }}>🤲 Handcrafted</div>}
        <button onClick={e => { e.stopPropagation(); onWishlist(p.id) }}
          style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.92)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          {inWl ? '❤️' : '🤍'}
        </button>
        <span>{p.emoji}</span>
      </div>
      <div style={{ padding: isMobile ? '12px 14px 14px' : '16px 18px 18px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:9, color:'#9C7A63', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{p.category}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 13 : 15, fontWeight:600, color:'#2C1A0E', lineHeight:1.3, marginBottom:7, flex:1 }}>{p.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:10 }}>
          <OcStars rating={p.rating} />
          <span style={{ fontSize:10, color:'#9C7A63' }}>({p.rc})</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
          <div>
            <span style={{ fontWeight:700, fontSize: isMobile ? 14 : 16, color:tc }}>${p.price}</span>
            {p.originalPrice && <span style={{ fontSize:10, color:'#B8A090', textDecoration:'line-through', marginLeft:4 }}>${p.originalPrice}</span>}
          </div>
          <button onClick={handleAdd} style={{ padding: isMobile ? '6px 11px' : '7px 14px', borderRadius:99, border:'none', background: added ? '#7A9A6B' : tc, color:'white', fontSize:10, fontWeight:700, cursor:'pointer', transition:'background 0.3s', flexShrink:0 }}>
            {added ? '✓ Added' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Quick view (same as design) ───────────────────────────────────
function OcQuickView({ p, onClose, onAddToCart, tc, isMobile }) {
  const [added, setAdded] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const handleAdd = () => {
    onAddToCart(p)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 900)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(44,26,14,0.52)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, animation:'ocFade 0.25s ease' }}>
      <div style={{ background:'#FAF7F2', borderRadius:28, width:'100%', maxWidth: isMobile ? '100%' : 680, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(44,26,14,0.22)', animation:'ocUp 0.3s ease' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          <div style={{ background:p.bg||'#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 80 : 110, minHeight: isMobile ? 220 : 340, borderRadius: isMobile ? '28px 28px 0 0' : '28px 0 0 28px', position:'relative' }}>
            {disc > 0 && <div style={{ position:'absolute', top:16, left:16, background:'#7A9A6B', color:'white', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99 }}>-{disc}% OFF</div>}
            <span>{p.emoji}</span>
          </div>
          <div style={{ padding: isMobile ? '24px 20px' : '32px 28px' }}>
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <button onClick={onClose} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:16, color:'#6B4F3A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ fontSize:10, color:'#9C7A63', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{p.category}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 20 : 24, fontWeight:700, lineHeight:1.2, marginBottom:12, color:'#2C1A0E' }}>{p.name}</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <OcStars rating={p.rating} size={14} />
              <span style={{ fontSize:12, color:'#9C7A63' }}>{p.rating} · {p.rc} reviews</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:18 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:tc }}>${p.price}</span>
              {p.originalPrice && <span style={{ fontSize:14, color:'#B8A090', textDecoration:'line-through' }}>${p.originalPrice}</span>}
            </div>
            {p.hc && <div style={{ fontSize:12, color:'#6B4F3A', background:'#F5EEE6', borderRadius:10, padding:'8px 14px', marginBottom:20, display:'inline-flex', gap:6, alignItems:'center' }}>🤲 Individually handcrafted</div>}
            <div style={{ fontSize:13, color:'#6B4F3A', lineHeight:1.65, marginBottom:22 }}>
              A beautifully curated gift that carries warmth and intention. Each piece is made with care and arrives gift-ready.
            </div>
            <button onClick={handleAdd} style={{ width:'100%', padding:'14px', borderRadius:99, border:'none', background: added ? '#7A9A6B' : tc, color:'white', fontWeight:700, fontSize:15, cursor:'pointer', transition:'background 0.3s', minHeight:50 }}>
              {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
            <button onClick={onClose} style={{ width:'100%', marginTop:10, padding:'12px', borderRadius:99, border:'1.5px solid #EDE4D8', background:'transparent', color:'#6B4F3A', fontWeight:600, fontSize:13, cursor:'pointer' }}>
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────
function SecHead({ label, title, isMobile, count }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom: isMobile ? 20 : 28 }}>
      <div>
        <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 21 : 28, fontWeight:700, color:'#2C1A0E', margin:0 }}>{title}</h2>
      </div>
      {count != null && <div style={{ fontSize:12, color:'#9C7A63' }}>{count} gifts</div>}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function OccasionPage({ occasion }) {
  const dispatch = useDispatch()
  const wishlistIds = useSelector(selectWishlistIds)
  // Convert array to Set so OcCard can use .has() — same as the design
  const wishlist = useMemo(() => new Set(wishlistIds), [wishlistIds])

  const [ww, setWw] = useState(window.innerWidth)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [quickView, setQuickView] = useState(null)
  const [sortBy, setSortBy] = useState('popular')
  const [priceMax, setPriceMax] = useState(100)
  const [catFilter, setCatFilter] = useState('All')
  const [hcOnly, setHcOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    const r = () => setWw(window.innerWidth)
    window.addEventListener('resize', r)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('resize', r); document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const k = e => { if (e.key === 'Escape' && !quickView) dispatch(clearActiveOccasion()) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [quickView, dispatch])

  // Fetch — fall back to OC_PRODUCTS demo data
  useEffect(() => {
    setLoading(true)
    setProducts([])
    productsApi.list({ occasion: occasion.id })
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : data?.content || []
        if (items.length) { setProducts(items); return }
        throw new Error('empty')
      })
      .catch(() => {
        let res = OC_PRODUCTS.filter(p => p.occ?.includes(occasion.id))
        if (res.length < 4) res = [...res, ...OC_PRODUCTS.filter(p => !res.includes(p)).slice(0, 8)]
        setProducts(res)
      })
      .finally(() => setTimeout(() => setLoading(false), 700))
  }, [occasion.id])

  const isMobile = ww < 768
  const cfg = OCC_CFG[occasion.id] || OCC_CFG.default

  const filtered = useMemo(() => {
    let p = products.filter(x => x.price <= priceMax)
    if (catFilter !== 'All') p = p.filter(x => x.category === catFilter)
    if (hcOnly) p = p.filter(x => x.hc)
    const sorts = { popular:(a,b)=>b.rc-a.rc, rating:(a,b)=>b.rating-a.rating, 'price-asc':(a,b)=>a.price-b.price, 'price-desc':(a,b)=>b.price-a.price, newest:(a,b)=>(b.tag==='New'?1:0)-(a.tag==='New'?1:0) }
    return [...p].sort(sorts[sortBy] || sorts.popular)
  }, [products, priceMax, catFilter, hcOnly, sortBy])

  const trending = products.filter(p => p.tag === 'Bestseller' || p.rc > 150).slice(0, 4)
  const handmade = products.filter(p => p.hc).slice(0, 4)
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const onWishlist = useCallback(id => dispatch(toggleWishlist(id)), [dispatch])
  const onAddToCart = useCallback(p => dispatch(addLocal(p)), [dispatch])

  // grid and skeletonGrid as inline functions (same pattern as design)
  const grid = (items, cols) => (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap: isMobile ? 12 : 20 }}>
      {items.map((p, i) => (
        <div key={p.id} style={{ animation:`ocUp 0.5s ease ${Math.min(i,5)*0.07}s backwards` }}>
          <OcCard p={p} onPreview={setQuickView} wishlist={wishlist} onWishlist={onWishlist} tc={TC} isMobile={isMobile} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  )

  const skeletonGrid = (n, cols) => (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap: isMobile ? 12 : 20 }}>
      {Array.from({length:n}).map((_,i) => <OcSkeleton key={i} isMobile={isMobile} />)}
    </div>
  )

  return (
    <div ref={bodyRef} style={{ position:'fixed', inset:0, zIndex:1050, overflowY:'auto', background:'#FAF7F2', animation:'ocFade 0.3s ease' }}>

      {/* Sticky header */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(250,247,242,0.96)', backdropFilter:'blur(14px)', borderBottom:'1px solid #EDE4D8', padding: isMobile ? '12px 20px' : '14px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => dispatch(clearActiveOccasion())} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', color:'#6B4F3A' }} title="Back">←</button>
          <div>
            <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Gifts for</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 17 : 21, fontWeight:700, color:'#2C1A0E', lineHeight:1 }}>{occasion.title}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setShowFilters(f => !f)} style={{ padding:'7px 15px', borderRadius:99, border:`1.5px solid ${showFilters ? TC : '#EDE4D8'}`, background: showFilters ? TC : 'white', color: showFilters ? 'white' : '#6B4F3A', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5, transition:'all 0.2s' }}>
            <span style={{ fontSize:11 }}>⚙</span> Filters
            {filtered.length !== products.length && !loading && <span style={{ background:'rgba(255,255,255,0.3)', borderRadius:99, padding:'1px 6px', fontSize:10 }}>{filtered.length}</span>}
          </button>
          <button onClick={() => dispatch(clearActiveOccasion())} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', fontSize:18, color:'#6B4F3A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background:cfg.g, padding: isMobile ? '44px 20px 52px' : '72px 48px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-30, width:280, height:280, borderRadius:'50%', background:'rgba(196,112,74,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-70, left:50, width:200, height:200, borderRadius:'50%', background:'rgba(122,154,107,0.07)', pointerEvents:'none' }} />
        <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems:'center', gap: isMobile ? 28 : 56, maxWidth:1100, margin:'0 auto' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.72)', backdropFilter:'blur(6px)', borderRadius:99, padding:'5px 14px', fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>
              ✦ {occasion.title}
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 'clamp(28px,7vw,38px)' : 'clamp(36px,4vw,54px)', fontWeight:700, lineHeight:1.06, color:'#2C1A0E', marginBottom:14 }}>
              {cfg.h}
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color:'#6B4F3A', lineHeight:1.68, marginBottom:28, maxWidth:460 }}>{cfg.s}</p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button style={{ padding: isMobile ? '12px 22px' : '14px 30px', borderRadius:99, border:'none', background:TC, color:'white', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 6px 24px rgba(196,112,74,0.3)' }}>{cfg.cta}</button>
              <button onClick={() => dispatch(clearActiveOccasion())} style={{ padding: isMobile ? '12px 18px' : '14px 24px', borderRadius:99, border:'1.5px solid #D9CBBF', background:'rgba(255,255,255,0.75)', color:'#2C1A0E', fontWeight:600, fontSize:14, cursor:'pointer' }}>All Occasions</button>
            </div>
            <div style={{ display:'flex', gap:20, marginTop:24, flexWrap:'wrap' }}>
              {[['🤲','Handcrafted'],['💌','Gift Wrapped'],['🌿','Eco Packing']].map(([e,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#6B4F3A', fontWeight:500 }}><span>{e}</span><span>{l}</span></div>
              ))}
            </div>
          </div>
          {!isMobile && (
            <div style={{ flexShrink:0, position:'relative', width:260, textAlign:'center' }}>
              <span style={{ fontSize:160, display:'block', animation:'ocFloat 3.6s ease-in-out infinite', filter:'drop-shadow(0 18px 36px rgba(44,26,14,0.12))' }}>{occasion.icon}</span>
              <span style={{ position:'absolute', top:-8, right:-10, fontSize:54, animation:'ocFloat 4.4s ease-in-out 0.5s infinite' }}>{cfg.e2}</span>
              <span style={{ position:'absolute', bottom:8, left:-10, fontSize:40, animation:'ocFloat 3.9s ease-in-out 1s infinite' }}>{cfg.e3}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background:'white', borderBottom:'1px solid #EDE4D8', padding: isMobile ? '16px 20px' : '20px 48px', animation:'ocUp 0.2s ease' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? 14 : 24, alignItems:'flex-start', maxWidth:1100, margin:'0 auto' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#9C7A63', textTransform:'uppercase', letterSpacing:'0.1em' }}>Sort</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding:'7px 12px', borderRadius:10, border:'1.5px solid #EDE4D8', fontSize:12, background:'white', color:'#2C1A0E', fontFamily:"'DM Sans',sans-serif", cursor:'pointer' }}>
                <option value="popular">Most Popular</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#9C7A63', textTransform:'uppercase', letterSpacing:'0.1em' }}>Max Price: ${priceMax}</span>
              <input type="range" min={15} max={100} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} style={{ accentColor:TC, width:130, cursor:'pointer' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#9C7A63', textTransform:'uppercase', letterSpacing:'0.1em' }}>Category</span>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {categories.slice(0,6).map(c => (
                  <button key={c} onClick={() => setCatFilter(c)} style={{ padding:'5px 12px', borderRadius:99, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', background: catFilter === c ? TC : '#F5EEE6', color: catFilter === c ? 'white' : '#6B4F3A', transition:'all 0.18s' }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:9, fontWeight:700, color:'#9C7A63', textTransform:'uppercase', letterSpacing:'0.1em' }}>Filter</span>
              <button onClick={() => setHcOnly(h => !h)} style={{ padding:'7px 14px', borderRadius:99, border:`1.5px solid ${hcOnly ? TC : '#EDE4D8'}`, background: hcOnly ? '#FDF6F1' : 'white', color: hcOnly ? TC : '#6B4F3A', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:5 }}>
                🤲 Handcrafted only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page body */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding: isMobile ? '36px 20px 72px' : '56px 48px 96px' }}>

        {/* Trending */}
        <div style={{ marginBottom: isMobile ? 52 : 72 }}>
          <SecHead label="Hot right now" title="Trending Gifts" isMobile={isMobile} />
          {loading ? skeletonGrid(4, isMobile ? 2 : 4) : grid(trending.length ? trending : products.slice(0,4), isMobile ? 2 : 4)}
        </div>

        {/* All gifts */}
        <div style={{ marginBottom: isMobile ? 52 : 72 }}>
          <SecHead label="Curated collection" title={`All ${occasion.title} Gifts`} isMobile={isMobile} count={!loading ? filtered.length : null} />
          {loading ? skeletonGrid(6, isMobile ? 2 : 3)
            : filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 20px', background:'white', borderRadius:24, border:'1px solid #EDE4D8' }}>
                <div style={{ fontSize:44, marginBottom:14 }}>🌿</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, marginBottom:8 }}>No gifts match your filters</div>
                <div style={{ fontSize:13, color:'#9C7A63', marginBottom:20 }}>Try adjusting the price or removing a filter</div>
                <button onClick={() => { setPriceMax(100); setCatFilter('All'); setHcOnly(false) }} style={{ padding:'11px 22px', borderRadius:99, border:`1.5px solid ${TC}`, background:'white', color:TC, fontWeight:700, fontSize:13, cursor:'pointer' }}>Clear Filters</button>
              </div>
            ) : grid(filtered, isMobile ? 2 : 3)
          }
        </div>

        {/* Handmade Collections */}
        {!loading && handmade.length > 0 && (
          <div style={{ marginBottom: isMobile ? 52 : 72 }}>
            <div style={{ background:'linear-gradient(135deg,#F5EEE6,#FAF7F2)', borderRadius: isMobile ? 20 : 28, padding: isMobile ? '28px 20px 32px' : '40px 48px', marginBottom: isMobile ? 22 : 32 }}>
              <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>By skilled artisans</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 22 : 30, fontWeight:700, color:'#2C1A0E', marginBottom:8 }}>Handmade Collections</h2>
              <p style={{ fontSize: isMobile ? 13 : 15, color:'#6B4F3A', lineHeight:1.65, maxWidth:520, margin:0 }}>Every piece is individually made by hand — no two are exactly alike. Each imperfection tells its story.</p>
            </div>
            {grid(handmade, isMobile ? 2 : 4)}
          </div>
        )}

        {/* Most Loved */}
        {!loading && (
          <div style={{ marginBottom: isMobile ? 52 : 72 }}>
            <SecHead label="Community favourites" title="Most Loved" isMobile={isMobile} />
            {grid([...products].sort((a,b) => b.rating - a.rating).slice(0, 4), isMobile ? 2 : 4)}
          </div>
        )}

        {/* Wishlisted */}
        {wishlist.size > 0 && (
          <div style={{ padding: isMobile ? '24px 20px' : '32px 36px', borderRadius: isMobile ? 18 : 24, border:'1.5px solid #EDE4D8', background:'white' }}>
            <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:6 }}>Your picks</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#2C1A0E', marginBottom:16 }}>Wishlisted ({wishlist.size})</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {products.filter(p => wishlist.has(p.id)).map(p => (
                <div key={p.id} onClick={() => setQuickView(p)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:14, background:'#FAF7F2', cursor:'pointer', border:'1px solid #EDE4D8', transition:'box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(44,26,14,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <span style={{ fontSize:24 }}>{p.emoji}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#2C1A0E' }}>{p.name}</div>
                    <div style={{ fontSize:11, color:TC, fontWeight:700 }}>${p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {quickView && <OcQuickView p={quickView} onClose={() => setQuickView(null)} onAddToCart={onAddToCart} tc={TC} isMobile={isMobile} />}
    </div>
  )
}
