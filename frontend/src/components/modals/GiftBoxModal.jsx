import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeBoxBuilder, openCart, openLogin } from '../../store/slices/uiSlice'
import { addBox } from '../../store/slices/cartSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { giftBoxApi } from '../../api/services'
import { useWindowWidth } from '../../hooks/useWindowWidth'

const TC = '#C4704A'
// Keys match the backend BoxSize enum. slots = capacity, price = base price.
const BOX_SIZES = {
  SMALL:  { label: 'Small',  slots: 2, price: 199, cols: 2, desc: '2 items · a sweet, simple gift' },
  MEDIUM: { label: 'Medium', slots: 4, price: 349, cols: 2, desc: '4 items · our most-loved size for any occasion' },
  LARGE:  { label: 'Large',  slots: 6, price: 549, cols: 3, desc: '6 items · go all-out with a generous spread' },
}
const RIBBONS = ['#C4704A', '#7A9A6B', '#8B6B9A', '#C4A44A', '#6B9AAA']
const CATEGORIES = ['All', 'Candles & Scents', 'Handmade Jewelry', 'Ceramics', 'Art Prints', 'Skincare', 'Books & Stationery', 'Food & Gourmet', 'Plants']

export default function GiftBoxModal() {
  const dispatch = useDispatch()
  const products = useSelector(selectProducts)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const ww = useWindowWidth()
  const isMobile = ww < 640

  const [boxSize, setBoxSize] = useState('MEDIUM')
  const BOX_SLOTS = BOX_SIZES[boxSize].slots
  const BOX_COLS = BOX_SIZES[boxSize].cols
  const BOX_PRICE = BOX_SIZES[boxSize].price

  const [slots, setSlots] = useState(Array(BOX_SIZES.MEDIUM.slots).fill(null))
  const [dragItem, setDragItem] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [previewProduct, setPreviewProduct] = useState(null)
  const [addedFlash, setAddedFlash] = useState(false)
  const [overIdx, setOverIdx] = useState(null)
  const [message, setMessage] = useState('')
  const [ribbonColor, setRibbonColor] = useState(TC)
  const [step, setStep] = useState(1)
  const [mobileTab, setMobileTab] = useState('products')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSlots((prev) => {
      const items = prev.filter(Boolean).slice(0, BOX_SLOTS)
      const next = Array(BOX_SLOTS).fill(null)
      items.forEach((it, i) => { next[i] = it })
      return next
    })
  }, [boxSize])

  const inBox = (productId) => slots.some((s) => s && s.id === productId)

  const handleAddToBox = (product) => {
    if (inBox(product.id)) return // backend rejects duplicate products in a box
    const firstEmpty = slots.findIndex((s) => !s)
    if (firstEmpty === -1) return
    setSlots((prev) => { const n = [...prev]; n[firstEmpty] = product; return n })
    setAddedFlash(true)
    setTimeout(() => { setAddedFlash(false); setPreviewProduct(null) }, 900)
  }

  const handleDrop = (idx) => {
    if (!dragItem) return
    // ignore if this product already sits in another slot (no duplicates allowed)
    if (slots.some((s, i) => s && s.id === dragItem.id && i !== idx)) { setDragItem(null); setOverIdx(null); return }
    setSlots((prev) => { const n = [...prev]; n[idx] = dragItem; return n })
    setDragItem(null); setOverIdx(null)
  }

  const removeSlot = (idx) => setSlots((prev) => { const n = [...prev]; n[idx] = null; return n })
  const itemsTotal = slots.filter(Boolean).reduce((s, p) => s + p.price, 0)
  const total = itemsTotal + BOX_PRICE
  const filled = slots.filter(Boolean).length
  const filteredProducts = products.filter((p) => activeCategory === 'All' || p.category === activeCategory)

  const addBoxToCart = async () => {
    // Building a box must be persisted server-side, which requires auth.
    if (!isLoggedIn) {
      dispatch(closeBoxBuilder())
      dispatch(openLogin())
      return
    }
    const productIds = slots.filter(Boolean).map((p) => p.id)
    if (productIds.length === 0) return
    setSaving(true); setError('')
    try {
      const { data } = await giftBoxApi.create({
        size: boxSize,
        wrapType: 'STANDARD',
        customMessage: message.trim() || null,
        productIds,
      })
      dispatch(addBox(data))
      dispatch(closeBoxBuilder())
      dispatch(openCart())
    } catch (e) {
      setError(e.response?.data?.message || 'Could not add gift box. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dispatch(closeBoxBuilder())}>
      <div style={{ background: '#FAF7F2', borderRadius: isMobile ? 20 : 24, width: '100%', maxWidth: isMobile ? '100%' : 880, maxHeight: isMobile ? '95vh' : '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(44,26,14,0.25)' }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '16px 20px 14px' : '24px 32px 20px', borderBottom: '1px solid #EDE4D8', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 12 : 0 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>Build Your Gift Box</div>
              {!isMobile && <div style={{ fontSize: 13, color: '#9C7A63', marginTop: 2 }}>Drag items from the menu into your box</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 2, 3].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: '50%', background: step >= s ? TC : '#EDE4D8', color: step >= s ? 'white' : '#9C7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, transition: 'all 0.3s' }}>{s}</div>
                  {s < 3 && <div style={{ width: isMobile ? 16 : 24, height: 1.5, background: step > s ? TC : '#EDE4D8' }} />}
                </div>
              ))}
              <button onClick={() => dispatch(closeBoxBuilder())} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#9C7A63', lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>
          {isMobile && step === 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {[['products', '🛍️ Products'], ['box', '🎁 My Box']].map(([tab, label]) => (
                <button key={tab} onClick={() => setMobileTab(tab)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', background: mobileTab === tab ? TC : '#EDE4D8', color: mobileTab === tab ? 'white' : '#6B4F3A', transition: 'all 0.2s' }}>
                  {label} {tab === 'box' && filled > 0 ? `(${filled})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', position: 'relative' }}>
          {step === 1 && (
            <>
              {/* Product list */}
              {(!isMobile || mobileTab === 'products') && (
                <div style={{ width: isMobile ? '100%' : 280, borderRight: isMobile ? 'none' : '1px solid #EDE4D8', borderBottom: isMobile ? '1px solid #EDE4D8' : 'none', padding: '16px', overflow: 'auto', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '5px 11px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: activeCategory === cat ? TC : '#EDE4D8', color: activeCategory === cat ? 'white' : '#6B4F3A', whiteSpace: 'nowrap' }}>{cat}</button>
                    ))}
                  </div>
                  {isMobile && <div style={{ fontSize: 12, color: '#9C7A63', marginBottom: 10, fontWeight: 500 }}>Tap a product to add it to your box</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {filteredProducts.map((p) => (
                      <div key={p.id} draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'copy'; setDragItem(p) }} onClick={() => setPreviewProduct(p)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 10px', background: 'white', borderRadius: 16, border: '1.5px solid #EDE4D8', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none', aspectRatio: '1 / 1', textAlign: 'center' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = TC; e.currentTarget.style.boxShadow = '0 4px 16px rgba(196,112,74,0.15)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#EDE4D8'; e.currentTarget.style.boxShadow = 'none' }}>
                        <span style={{ fontSize: 32 }}>{p.emoji}</span>
                        <div style={{ fontWeight: 600, color: '#2C1A0E', fontSize: 12, lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ color: TC, fontSize: 12, fontWeight: 700 }}>₹{p.price}</div>
                        <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 500 }}>tap or drag</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Box */}
              {(!isMobile || mobileTab === 'box') && (
                <div style={{ flex: 1, padding: isMobile ? '16px' : '24px 36px', overflow: 'auto' }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#9C7A63', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Box Size</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {Object.entries(BOX_SIZES).map(([key, s]) => (
                        <button key={key} onClick={() => setBoxSize(key)} style={{ padding: isMobile ? '10px 6px' : '12px 8px', borderRadius: 14, cursor: 'pointer', border: boxSize === key ? `2px solid ${TC}` : '2px solid #EDE4D8', background: boxSize === key ? '#FDF6F1' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all 0.2s' }}>
                          <div style={{ fontSize: isMobile ? 22 : 26 }}>{key === 'SMALL' ? '🎁' : key === 'MEDIUM' ? '📦' : '🧰'}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: boxSize === key ? TC : '#2C1A0E' }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: '#9C7A63' }}>{s.slots} items · +₹{s.price}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#9C7A63', marginTop: 8, fontStyle: 'italic' }}>{BOX_SIZES[boxSize].desc}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#6B4F3A' }}><b style={{ color: TC }}>{filled}</b>/{BOX_SLOTS} items</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700 }}>Total: <span style={{ color: TC }}>₹{total}</span></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: '#9C7A63', fontWeight: 500 }}>Ribbon:</span>
                    {RIBBONS.map((c) => (
                      <button key={c} onClick={() => setRibbonColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: ribbonColor === c ? `3px solid ${c}` : '3px solid transparent', outlineOffset: 2, transition: 'outline 0.2s', flexShrink: 0 }} />
                    ))}
                  </div>

                  <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 16 : 24, border: '2px dashed #EDE4D8', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: '100%', background: ribbonColor, opacity: 0.3, borderRadius: 99 }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', height: 3, width: '100%', background: ribbonColor, opacity: 0.3, borderRadius: 99 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOX_COLS},1fr)`, gap: isMobile ? 8 : 12, position: 'relative', zIndex: 1 }}>
                      {slots.map((item, idx) => (
                        <div key={idx} onDragOver={(e) => { e.preventDefault(); setOverIdx(idx) }} onDragLeave={() => setOverIdx(null)} onDrop={() => handleDrop(idx)}
                          style={{ height: isMobile ? 80 : 100, borderRadius: 12, border: item ? 'none' : `2px dashed ${overIdx === idx ? TC : '#D9CBBF'}`, background: item ? item.bg : overIdx === idx ? '#F5EEE6' : '#FDFAF7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative', transition: 'all 0.2s' }}>
                          {item ? (
                            <>
                              <span style={{ fontSize: isMobile ? 22 : 28 }}>{item.emoji}</span>
                              <div style={{ fontSize: 9, fontWeight: 600, color: '#2C1A0E', textAlign: 'center', padding: '0 4px', lineHeight: 1.2 }}>{item.name}</div>
                              <div style={{ fontSize: 9, color: '#9C7A63' }}>₹{item.price}</div>
                              <button onClick={() => removeSlot(idx)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(44,26,14,0.12)', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B4F3A' }}>×</button>
                            </>
                          ) : (
                            <div style={{ color: overIdx === idx ? TC : '#C5B5A5', fontSize: 11, textAlign: 'center', padding: '0 4px' }}>
                              {isMobile ? 'Empty' : overIdx === idx ? 'Drop!' : `Slot ${idx + 1}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => setStep(2)} disabled={filled === 0}
                      style={{ padding: '13px 28px', borderRadius: 99, border: 'none', background: filled > 0 ? TC : '#EDE4D8', color: filled > 0 ? 'white' : '#9C7A63', fontWeight: 600, fontSize: 14, cursor: filled > 0 ? 'pointer' : 'default', transition: 'all 0.2s', minHeight: 48, width: isMobile ? '100%' : 'auto' }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Product preview overlay */}
              {previewProduct && (
                <div onClick={() => setPreviewProduct(null)} style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(250,247,242,0.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, padding: '28px 24px', boxShadow: '0 16px 60px rgba(44,26,14,0.18)', width: 260, textAlign: 'center', border: '1.5px solid #EDE4D8', position: 'relative' }} className="animate-fade-up">
                    <button onClick={() => setPreviewProduct(null)} style={{ position: 'absolute', top: 12, right: 12, background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>{previewProduct.emoji}</div>
                    <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{previewProduct.category}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{previewProduct.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: TC, marginBottom: 20 }}>₹{previewProduct.price}</div>
                    {(() => {
                      const dup = inBox(previewProduct.id)
                      const full = filled >= BOX_SLOTS
                      const disabled = dup || full
                      return (
                        <button onClick={() => handleAddToBox(previewProduct)} disabled={disabled}
                          style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: addedFlash ? '#7A9A6B' : disabled ? '#EDE4D8' : TC, color: disabled ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: disabled ? 'default' : 'pointer', transition: 'background 0.3s', minHeight: 48 }}>
                          {addedFlash ? 'Added ✓' : dup ? 'Already in Box' : full ? 'Box is Full' : 'Add to Box 🎁'}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Message */}
          {step === 2 && (
            <div style={{ flex: 1, padding: isMobile ? '24px 20px' : '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 18 : 20, fontWeight: 600, marginBottom: 8 }}>Add a Personal Message</div>
                <div style={{ color: '#9C7A63', fontSize: 13, lineHeight: 1.5 }}>Your words will be beautifully printed on a card inside the box</div>
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write something heartfelt... ✨" maxLength={240}
                style={{ width: '100%', maxWidth: 520, height: 160, border: '1.5px solid #EDE4D8', borderRadius: 16, padding: '14px 18px', fontFamily: "'Lora',serif", fontSize: 15, lineHeight: 1.7, color: '#2C1A0E', background: '#FDFAF7', resize: 'none', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = '#EDE4D8'} />
              <div style={{ fontSize: 12, color: '#C5B5A5', alignSelf: 'flex-end', marginTop: -12 }}>{message.length}/240</div>
              {message && (
                <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #EDE4D8', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 4px 20px rgba(44,26,14,0.06)' }}>
                  <div style={{ fontSize: 10, color: TC, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>✦ Pretty.Crafted ✦</div>
                  <div style={{ fontFamily: "'Lora',serif", fontSize: 13, lineHeight: 1.7, color: '#2C1A0E', fontStyle: 'italic' }}>{message}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 400 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '13px 20px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'none', color: '#6B4F3A', fontWeight: 500, cursor: 'pointer', minHeight: 48 }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 2, padding: '13px 24px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 48 }}>Preview Box →</button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div style={{ flex: 1, padding: isMobile ? '24px 20px' : '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: isMobile ? 20 : 22, fontWeight: 700, marginBottom: 4 }}>Your Gift Box is Ready! 🎁</div>
                <div style={{ color: '#9C7A63', fontSize: 14 }}>Here's what's inside</div>
              </div>
              <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? 20 : 32, width: '100%', maxWidth: 520, boxShadow: '0 8px 40px rgba(44,26,14,0.10)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: '100%', background: ribbonColor, opacity: 0.25 }} />
                <div style={{ position: 'absolute', top: '50%', left: 0, height: 3, width: '100%', background: ribbonColor, opacity: 0.25 }} />
                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 36, height: 36, borderRadius: '50%', background: ribbonColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 2 }}>🎀</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 20, position: 'relative', zIndex: 1 }}>
                  {slots.filter(Boolean).map((item, i) => (
                    <div key={i} style={{ background: item.bg || '#EDE4D8', borderRadius: 12, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 22 }}>{item.emoji}</span>
                      <div style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', color: '#2C1A0E', lineHeight: 1.2 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#6B4F3A' }}>₹{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
              {message && (
                <div style={{ background: '#FDFAF7', borderRadius: 12, padding: '14px 20px', border: '1px dashed #D9CBBF', width: '100%', maxWidth: 400, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: TC, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>✦ Your Message ✦</div>
                  <div style={{ fontFamily: "'Lora',serif", fontSize: 13, fontStyle: 'italic', color: '#2C1A0E', lineHeight: 1.7 }}>{message}</div>
                </div>
              )}
              <div style={{ background: '#F5EEE6', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 520, gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9C7A63' }}>Box total ({filled} items)</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: TC }}>₹{total}</div>
                </div>
                <button onClick={addBoxToCart} disabled={saving}
                  style={{ padding: '14px 28px', borderRadius: 99, border: 'none', background: saving ? '#EDE4D8' : TC, color: saving ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(196,112,74,0.35)', minHeight: 48, flex: isMobile ? 1 : 'none' }}>
                  {saving ? 'Adding…' : 'Add to Cart 🛒'}
                </button>
              </div>
              {error && <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A', width: '100%', maxWidth: 520 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 520 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '11px 16px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'none', color: '#6B4F3A', fontWeight: 500, cursor: 'pointer', fontSize: 13, minHeight: 44 }}>← Edit Message</button>
                <button onClick={() => { setStep(1); setMobileTab('products') }} style={{ flex: 1, padding: '11px 16px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'none', color: '#6B4F3A', fontWeight: 500, cursor: 'pointer', fontSize: 13, minHeight: 44 }}>Rebuild Box</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
