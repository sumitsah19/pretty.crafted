import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeOccasions, setActiveOccasion, openBoxBuilder } from '../../store/slices/uiSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { setActiveProduct } from '../../store/slices/uiSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const TC = '#C4704A'

const OCCASIONS = [
  { id:'valentines',   title:"Valentine's Day",  sub:'Speak love through craft',        icon:'💝', color:'#E8C5C5', featured:false },
  { id:'mothers',      title:"Mother's Day",     sub:'Thoughtful gifts made with love', icon:'💐', color:'#F0D5DC', featured:true, season:'May' },
  { id:'fathers',      title:"Father's Day",     sub:'Honor him in style',              icon:'🎩', color:'#C8B89A' },
  { id:'birthday',     title:'Birthday Gifts',   sub:'Make birthdays unforgettable',    icon:'🎂', color:'#E8D5C4' },
  { id:'anniversary',  title:'Anniversary',      sub:'Celebrate years of love',         icon:'💍', color:'#E0D5C5' },
  { id:'wedding',      title:'Wedding',          sub:'For the start of forever',        icon:'💒', color:'#F2EAE0' },
  { id:'baby',         title:'Baby Shower',      sub:'Soft welcomes for tiny humans',   icon:'🍼', color:'#D8E4DC' },
  { id:'graduation',   title:'Graduation',       sub:'Mark the milestone',              icon:'🎓', color:'#D4C5B5' },
  { id:'friendship',   title:'Friendship',       sub:'For your favorite person',        icon:'🌻', color:'#EDD8B0' },
  { id:'christmas',    title:'Christmas',        sub:'Wrapped in warmth & wonder',      icon:'🎄', color:'#C8DBC4' },
  { id:'newyear',      title:'New Year',         sub:'Fresh starts, beautiful gifts',   icon:'✨', color:'#E4D8B0' },
  { id:'housewarming', title:'Housewarming',     sub:'Welcome home, with love',         icon:'🏡', color:'#E0CFB8' },
  { id:'thankyou',     title:'Thank You',        sub:'Gratitude, beautifully said',     icon:'🌷', color:'#E8D0C8' },
  { id:'him',          title:'For Him',          sub:'Crafted for the modern man',      icon:'🥃', color:'#C4D0C0' },
  { id:'her',          title:'For Her',          sub:'Refined, romantic, real',         icon:'🌹', color:'#F0D5DC' },
  { id:'kids',         title:'For Kids',         sub:'Joy, in every detail',            icon:'🧸', color:'#D4C0D0' },
  { id:'corporate',    title:'Corporate Gifts',  sub:'Premium, thoughtful, on-brand',   icon:'🎁', color:'#D9CFC2' },
]

export { OCCASIONS }

export default function OccasionsModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const ww = useWindowWidth()
  const isMobile = ww < 768
  const cols = isMobile ? 2 : ww < 1100 ? 3 : 4
  const [hovered, setHovered] = useState(null)
  const popRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const k = e => { if (e.key === 'Escape') dispatch(closeOccasions()) }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [dispatch])

  const featured = OCCASIONS.find(o => o.featured) || OCCASIONS[1]
  const popular = products.filter(p => p.tag === 'Bestseller' || p.tag === 'New').slice(0, 8)

  const scrollPop = dir => popRef.current?.scrollBy({ left: dir * (isMobile ? 200 : 320), behavior: 'smooth' })

  const openOccasion = occ => {
    dispatch(closeOccasions())
    setTimeout(() => dispatch(setActiveOccasion(occ)), 120)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && dispatch(closeOccasions())}
      style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(44,26,14,0.55)', backdropFilter:'blur(6px)', overflowY:'auto' }}
      className="animate-fade-up">

      <div style={{ background:'#FAF7F2', minHeight:'100vh', width:'100%', animation:'fadeUp 0.4s ease forwards' }}>

        {/* Sticky top bar */}
        <div style={{ position:'sticky', top:0, zIndex:5, background:'rgba(250,247,242,0.95)', backdropFilter:'blur(8px)', borderBottom:'1px solid #EDE4D8', padding: isMobile ? '16px 20px' : '18px 48px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:11, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Browse</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight:700, color:'#2C1A0E', lineHeight:1.1 }}>Occasions</div>
          </div>
          <button onClick={() => dispatch(closeOccasions())} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:40, height:40, cursor:'pointer', fontSize:20, color:'#6B4F3A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Featured hero */}
        <div style={{ padding: isMobile ? '24px 20px 0' : '32px 48px 0' }}>
          <div style={{ background:`linear-gradient(135deg, ${featured.color}, #FAF7F2)`, borderRadius: isMobile ? 20 : 28, padding: isMobile ? '28px 24px' : '44px 48px', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: isMobile ? 20 : 32, alignItems:'center', overflow:'hidden', position:'relative' }}>
            <div>
              <div style={{ fontSize:11, color:TC, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>✦ Featured this {featured.season || 'season'}</div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 32 : 48, fontWeight:700, lineHeight:1.05, color:'#2C1A0E', marginBottom:12 }}>{featured.title}</h2>
              <p style={{ fontSize: isMobile ? 14 : 16, color:'#6B4F3A', lineHeight:1.6, marginBottom:20, maxWidth:460 }}>
                {featured.sub}. Hand-picked, hand-wrapped, and ready to make her feel cherished. Browse our curated edit below.
              </p>
              <button onClick={() => openOccasion(featured)} style={{ padding:'13px 28px', borderRadius:99, border:'none', background:'#2C1A0E', color:'white', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 6px 20px rgba(44,26,14,0.2)' }}>
                Shop the Edit →
              </button>
            </div>
            <div style={{ fontSize: isMobile ? 120 : 180, textAlign:'center', animation:'float 3s ease-in-out infinite', filter:'drop-shadow(0 12px 24px rgba(44,26,14,0.15))' }}>{featured.icon}</div>
            <div style={{ position:'absolute', top:24, right:24, fontSize:12, color:TC, fontWeight:700, background:'rgba(255,255,255,0.7)', padding:'6px 12px', borderRadius:99, letterSpacing:'0.06em', textTransform:'uppercase' }}>Limited Edit</div>
          </div>
        </div>

        {/* Occasion grid */}
        <div style={{ padding: isMobile ? '32px 20px 16px' : '48px 48px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight:700, color:'#2C1A0E' }}>Every Occasion</h3>
            <div style={{ fontSize:12, color:'#9C7A63' }}>{OCCASIONS.length} categories</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap: isMobile ? 12 : 18 }}>
            {OCCASIONS.map((o, i) => (
              <button key={o.id}
                onMouseEnter={() => setHovered(o.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => openOccasion(o)}
                style={{ border:'none', padding:0, cursor:'pointer', background:o.color, borderRadius: isMobile ? 16 : 20, textAlign:'left', overflow:'hidden', position:'relative', aspectRatio: isMobile ? '1/1.05' : '1/1.1', transition:'transform 0.3s cubic-bezier(.2,.9,.3,1.4), box-shadow 0.3s', transform: hovered === o.id ? 'translateY(-4px) scale(1.02)' : 'none', boxShadow: hovered === o.id ? '0 16px 40px rgba(44,26,14,0.18)' : '0 2px 10px rgba(44,26,14,0.05)', animation:`fadeUp 0.5s ease ${i * 0.03}s backwards` }}>
                <div style={{ fontSize: isMobile ? 44 : 60, position:'absolute', top: isMobile ? 14 : 22, right: isMobile ? 14 : 22, transition:'transform 0.4s cubic-bezier(.2,.9,.3,1.4)', transform: hovered === o.id ? 'scale(1.15) rotate(-6deg)' : 'none', filter:'drop-shadow(0 4px 12px rgba(44,26,14,0.12))' }}>{o.icon}</div>
                <div style={{ position:'absolute', bottom: isMobile ? 14 : 22, left: isMobile ? 14 : 22, right: isMobile ? 14 : 22 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 16 : 19, fontWeight:700, color:'#2C1A0E', lineHeight:1.15, marginBottom:4 }}>{o.title}</div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color:'#6B4F3A', lineHeight:1.4 }}>{o.sub}</div>
                  <div style={{ marginTop:8, fontSize:11, fontWeight:700, color:TC, opacity: hovered === o.id ? 1 : 0.6, transition:'opacity 0.2s', display:'flex', alignItems:'center', gap:4 }}>
                    Shop now <span style={{ transform: hovered === o.id ? 'translateX(4px)' : 'none', transition:'transform 0.3s', display:'inline-block' }}>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Popular This Week */}
        {popular.length > 0 && (
          <div style={{ padding: isMobile ? '32px 0 24px' : '48px 48px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, padding: isMobile ? '0 20px' : 0 }}>
              <div>
                <div style={{ fontSize:11, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>Trending</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 22 : 28, fontWeight:700, color:'#2C1A0E' }}>Popular This Week</h3>
              </div>
              {!isMobile && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => scrollPop(-1)} style={{ width:40, height:40, borderRadius:'50%', border:'1px solid #EDE4D8', background:'white', cursor:'pointer', fontSize:18, color:'#2C1A0E', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                  <button onClick={() => scrollPop(1)} style={{ width:40, height:40, borderRadius:'50%', border:'1px solid #EDE4D8', background:'white', cursor:'pointer', fontSize:18, color:'#2C1A0E', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>
              )}
            </div>
            <div ref={popRef} style={{ display:'flex', gap:14, overflowX:'auto', scrollSnapType:'x mandatory', padding: isMobile ? '0 20px 8px' : '0 0 8px', scrollbarWidth:'none' }} className="no-scrollbar">
              {popular.map(p => (
                <div key={p.id} onClick={() => { dispatch(closeOccasions()); setTimeout(() => dispatch(setActiveProduct(p)), 200) }}
                  style={{ flexShrink:0, width: isMobile ? 170 : 220, background:'white', borderRadius:18, overflow:'hidden', cursor:'pointer', scrollSnapAlign:'start', border:'1px solid #EDE4D8', transition:'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(44,26,14,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ aspectRatio:'1/1', background:p.bg||'#EDE4D8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:60, position:'relative' }}>
                    {p.tag && <span style={{ position:'absolute', top:10, left:10, background: p.tag === 'New' ? '#7A9A6B' : TC, color:'white', fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99, letterSpacing:'0.06em', textTransform:'uppercase' }}>{p.tag}</span>}
                    {p.emoji}
                  </div>
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ fontSize:10, color:'#9C7A63', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{p.category}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:'#2C1A0E', lineHeight:1.3, marginBottom:6, minHeight:38 }}>{p.name}</div>
                    <div style={{ fontWeight:700, color:TC, fontSize:15 }}>${p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: isMobile ? '24px 20px 40px' : '32px 48px 56px', borderTop:'1px solid #EDE4D8', marginTop:16, display:'flex', flexWrap:'wrap', gap:24, justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:13, color:'#6B4F3A' }}>
            <b style={{ color:'#2C1A0E' }}>Can't decide?</b> Build your own gift box — pick the size, fill the slots, choose a ribbon.
          </div>
          <button onClick={() => { dispatch(closeOccasions()); setTimeout(() => dispatch(openBoxBuilder()), 120) }} style={{ padding:'12px 24px', borderRadius:99, border:`1.5px solid ${TC}`, background:'white', color:TC, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            Build a Gift Box →
          </button>
        </div>
      </div>
    </div>
  )
}
