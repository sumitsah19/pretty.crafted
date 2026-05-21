import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { clearPersonalizationProduct } from '../../store/slices/uiSlice'
import { addLocal } from '../../store/slices/cartSlice'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const TC = '#C4704A'

const WRAP_STYLES = [
  { id:'classic',  label:'Classic Kraft',  emoji:'📦', desc:'Warm kraft paper, twine bow',     extra:0 },
  { id:'luxe',     label:'Luxe Matte',     emoji:'🎁', desc:'Matte black, gold ribbon detail', extra:4 },
  { id:'garden',   label:'Garden Bloom',   emoji:'🌸', desc:'Floral print, sage grosgrain',    extra:3 },
  { id:'vintage',  label:'Vintage Linen',  emoji:'🧺', desc:'Natural linen wrap, wax seal',    extra:5 },
]

const RIBBON_COLORS = [
  { id:'terracotta', hex:'#C4704A', label:'Terracotta' },
  { id:'sage',       hex:'#7A9A6B', label:'Sage'       },
  { id:'dusty-rose', hex:'#C49AA0', label:'Dusty Rose' },
  { id:'midnight',   hex:'#4A5A7A', label:'Midnight'   },
  { id:'gold',       hex:'#C4A44A', label:'Gold'       },
]

const CARD_THEMES = [
  { id:'botanical', label:'Botanical', bg:'#D5E0CC', fg:'#2C4A1A', preview:'🌿' },
  { id:'romantic',  label:'Romantic',  bg:'#F0D5DC', fg:'#6B1A30', preview:'🌹' },
  { id:'minimal',   label:'Minimal',   bg:'#EDE4D8', fg:'#2C1A0E', preview:'✦'  },
  { id:'festive',   label:'Festive',   bg:'#E8D5C4', fg:'#8B3A0E', preview:'🎊' },
]

function GiftPreview({ wrap, ribbon, message, theme, product }) {
  const wrapStyle = WRAP_STYLES.find(w => w.id === wrap) || WRAP_STYLES[0]
  const ribbonColor = RIBBON_COLORS.find(r => r.id === ribbon) || RIBBON_COLORS[0]
  const cardTheme = CARD_THEMES.find(c => c.id === theme) || CARD_THEMES[0]
  const bgMap = { classic:'#D4B896', luxe:'#2C2C2C', garden:'#C8D8C0', vintage:'#D4C8B0' }
  const boxBg = bgMap[wrap] || '#D4B896'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:boxBg, borderRadius:20, padding:'28px 20px 20px', textAlign:'center', position:'relative', overflow:'hidden', minHeight:200 }}>
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:10, height:'100%', background:ribbonColor.hex, opacity:0.7, borderRadius:99 }} />
        <div style={{ position:'absolute', top:'50%', left:0, transform:'translateY(-50%)', height:10, width:'100%', background:ribbonColor.hex, opacity:0.7, borderRadius:99 }} />
        <div style={{ position:'relative', zIndex:2, marginBottom:8 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:ribbonColor.hex, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:16, boxShadow:`0 4px 12px ${ribbonColor.hex}60` }}>✦</div>
        </div>
        <div style={{ fontSize:64, position:'relative', zIndex:2, filter:'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>
          {product?.emoji || '🎁'}
        </div>
        <div style={{ position:'relative', zIndex:2, marginTop:8, fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.85)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
          {wrapStyle.label}
        </div>
        <div style={{ position:'absolute', bottom:8, right:10, fontSize:20, opacity:0.5 }}>{wrapStyle.emoji}</div>
      </div>
      {message.trim() && (
        <div style={{ background:cardTheme.bg, borderRadius:14, padding:'16px 18px', borderLeft:`3px solid ${ribbonColor.hex}`, transition:'all 0.3s' }}>
          <div style={{ fontSize:9, fontWeight:700, color:cardTheme.fg, opacity:0.6, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Your Message</div>
          <div style={{ fontFamily:"'Lora',serif", fontSize:13, color:cardTheme.fg, lineHeight:1.65, fontStyle:'italic', wordBreak:'break-word' }}>"{message}"</div>
        </div>
      )}
    </div>
  )
}

export default function PersonalizationModal() {
  const dispatch = useDispatch()
  const product = useSelector(s => s.ui.personalizationProduct)
  const ww = useWindowWidth()
  const isMobile = ww < 768

  const [wrap, setWrap] = useState('classic')
  const [ribbon, setRibbon] = useState('terracotta')
  const [message, setMessage] = useState('')
  const [cardTheme, setCardTheme] = useState('botanical')
  const [includeCard, setIncludeCard] = useState(false)
  const [engraving, setEngraving] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const k = e => { if (e.key === 'Escape') dispatch(clearPersonalizationProduct()) }
    window.addEventListener('keydown', k)
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [dispatch])

  const wrapExtra = (WRAP_STYLES.find(w => w.id === wrap) || WRAP_STYLES[0]).extra
  const cardExtra = includeCard ? 5 : 0
  const engravingExtra = engraving.trim() ? 8 : 0
  const totalExtra = wrapExtra + cardExtra + engravingExtra

  const handleSave = () => {
    setSaved(true)
    if (product) dispatch(addLocal({ ...product, price: product.price + totalExtra }))
    setTimeout(() => dispatch(clearPersonalizationProduct()), 800)
  }

  const inp = { width:'100%', padding:'10px 14px', borderRadius:12, border:'1.5px solid #EDE4D8', fontSize:13, fontFamily:"'DM Sans',sans-serif", background:'white', color:'#2C1A0E', outline:'none', transition:'border-color 0.2s' }
  const focus = e => e.target.style.borderColor = TC
  const blur  = e => e.target.style.borderColor = '#EDE4D8'

  return (
    <div onClick={e => e.target === e.currentTarget && dispatch(clearPersonalizationProduct())}
      style={{ position:'fixed', inset:0, zIndex:1200, background:'rgba(44,26,14,0.52)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? 0 : 16 }}
      className="animate-fade-up">
      <div style={{ background:'#FAF7F2', borderRadius: isMobile ? '28px 28px 0 0' : 28, width:'100%', maxWidth: isMobile ? '100%' : 900, maxHeight: isMobile ? '95vh' : '92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(44,26,14,0.22)', marginTop: isMobile ? 'auto' : 0 }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '18px 20px 16px' : '24px 32px 20px', borderBottom:'1px solid #EDE4D8', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>Personalize Your Gift</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#2C1A0E' }}>{product?.name || 'Gift Box'}</div>
          </div>
          <button onClick={() => dispatch(clearPersonalizationProduct())} style={{ background:'#F5EEE6', border:'none', borderRadius:'50%', width:38, height:38, cursor:'pointer', fontSize:18, color:'#6B4F3A', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Left: controls */}
          <div style={{ flex:'0 0 auto', width: isMobile ? '100%' : 480, padding: isMobile ? '20px' : '28px 32px', overflow:'auto', borderRight: isMobile ? 'none' : '1px solid #EDE4D8' }}>

            {/* Wrapping style */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Wrapping Style</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {WRAP_STYLES.map(w => (
                  <button key={w.id} onClick={() => setWrap(w.id)}
                    style={{ padding:'12px 14px', borderRadius:14, border:`2px solid ${wrap === w.id ? TC : '#EDE4D8'}`, background: wrap === w.id ? '#FDF6F1' : 'white', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                    <div style={{ fontSize:22, marginBottom:6 }}>{w.emoji}</div>
                    <div style={{ fontSize:12, fontWeight:700, color: wrap === w.id ? TC : '#2C1A0E', marginBottom:2 }}>{w.label}</div>
                    <div style={{ fontSize:10, color:'#9C7A63', lineHeight:1.4 }}>{w.desc}</div>
                    {w.extra > 0 && <div style={{ fontSize:10, fontWeight:700, color:'#7A9A6B', marginTop:4 }}>+${w.extra}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Ribbon color */}
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Ribbon Color</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                {RIBBON_COLORS.map(r => (
                  <button key={r.id} onClick={() => setRibbon(r.id)} title={r.label}
                    style={{ width:34, height:34, borderRadius:'50%', background:r.hex, border:'none', cursor:'pointer', outline: ribbon === r.id ? `3px solid ${r.hex}` : '3px solid transparent', outlineOffset:3, transition:'outline 0.2s', flexShrink:0 }} />
                ))}
                <span style={{ fontSize:11, color:'#9C7A63', marginLeft:4 }}>{RIBBON_COLORS.find(r => r.id === ribbon)?.label}</span>
              </div>
            </div>

            {/* Personal message */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em' }}>Personal Message</div>
                <div style={{ fontSize:10, color:'#9C7A63' }}>{message.length}/200</div>
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value.slice(0,200))}
                placeholder="Write something from the heart…"
                style={{ ...inp, height:100, resize:'none', fontFamily:"'Lora',serif", lineHeight:1.65 }}
                onFocus={focus} onBlur={blur} />
            </div>

            {/* Greeting card */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em' }}>Greeting Card</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:'#9C7A63' }}>+$5</span>
                  <button onClick={() => setIncludeCard(c => !c)} style={{ width:44, height:24, borderRadius:99, border:'none', background: includeCard ? TC : '#EDE4D8', cursor:'pointer', position:'relative', transition:'background 0.3s' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: includeCard ? 22 : 3, transition:'left 0.3s', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }} />
                  </button>
                </div>
              </div>
              {includeCard && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {CARD_THEMES.map(t => (
                    <button key={t.id} onClick={() => setCardTheme(t.id)}
                      style={{ padding:'12px 8px', borderRadius:12, border:`2px solid ${cardTheme === t.id ? TC : '#EDE4D8'}`, background:t.bg, cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{t.preview}</div>
                      <div style={{ fontSize:10, fontWeight:600, color:t.fg }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Engraving */}
            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em' }}>Engraved Text</div>
                <span style={{ fontSize:10, color:'#9C7A63', background:'#F5EEE6', padding:'2px 8px', borderRadius:99 }}>optional +$8</span>
              </div>
              <input value={engraving} onChange={e => setEngraving(e.target.value.slice(0,40))}
                placeholder='"Always & Forever" or a name…'
                style={inp} onFocus={focus} onBlur={blur} />
              {engraving.trim() && <div style={{ fontSize:10, color:'#7A9A6B', marginTop:5, fontWeight:600 }}>✓ Engraving added (+$8)</div>}
            </div>
          </div>

          {/* Right: live preview */}
          <div style={{ flex:1, padding: isMobile ? '0 20px 24px' : '28px 32px', background:'#F7F3EE', overflow:'auto', display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <div style={{ fontSize:10, color:TC, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:14 }}>Live Preview</div>
              <GiftPreview wrap={wrap} ribbon={ribbon} message={message} theme={cardTheme} product={product} />
            </div>
            {/* Pricing */}
            <div style={{ background:'white', borderRadius:16, padding:'18px 20px', border:'1px solid #EDE4D8' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#6B4F3A', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Personalization Summary</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  ['Base price', `$${product?.price || 0}`],
                  ...(wrapExtra > 0 ? [[`Wrapping (${WRAP_STYLES.find(w => w.id === wrap)?.label})`, `+$${wrapExtra}`]] : []),
                  ...(includeCard ? [['Greeting card', '+$5']] : []),
                  ...(engraving.trim() ? [['Engraving', '+$8']] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'#6B4F3A' }}>{k}</span>
                    <span style={{ fontWeight:600, color:'#2C1A0E' }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1.5px solid #EDE4D8', paddingTop:10, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:700, color:'#2C1A0E' }}>Total</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18, color:TC }}>${(product?.price || 0) + totalExtra}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? '14px 20px' : '18px 32px', borderTop:'1px solid #EDE4D8', display:'flex', gap:12, flexShrink:0, background:'#FAF7F2' }}>
          <button onClick={() => dispatch(clearPersonalizationProduct())} style={{ flex:1, padding:'13px', borderRadius:99, border:'1.5px solid #EDE4D8', background:'white', color:'#6B4F3A', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} style={{ flex:2, padding:'13px', borderRadius:99, border:'none', background: saved ? '#7A9A6B' : TC, color:'white', fontWeight:700, fontSize:14, cursor:'pointer', transition:'background 0.3s' }}>
            {saved ? 'Saved! ✓' : `Save Personalization${totalExtra > 0 ? ` (+$${totalExtra})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
