import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, updateLocal, removeLocal, addLocal } from '../../store/slices/cartSlice'
import { openCheckout, closeCart } from '../../store/slices/uiSlice'
import { selectProducts } from '../../store/slices/productsSlice'

const TC = '#C4704A'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const { items } = useSelector(selectCart)
  const products = useSelector(selectProducts)
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [giftWrap, setGiftWrap] = useState(false)
  const [savedItems, setSavedItems] = useState([])

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  const discount = promoApplied ? Math.round(subtotal * 0.15) : 0
  const shipping = subtotal >= 60 ? 0 : 5.99
  const giftWrapFee = giftWrap ? 4 : 0
  const total = subtotal - discount + shipping + giftWrapFee
  const FREE_SHIPPING_AT = 60
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_AT) * 100)

  const suggestions = products.filter((p) => p.tag === 'Bestseller' && !items.find((i) => i.product.id === p.id)).slice(0, 3)

  const saveForLater = (idx) => {
    setSavedItems((prev) => [...prev, items[idx].product])
    dispatch(removeLocal(idx))
  }
  const moveToCart = (p) => {
    setSavedItems((prev) => prev.filter((x) => x.id !== p.id))
    dispatch(addLocal(p))
  }
  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'PRETTY15') { setPromoApplied(true); setPromoError('') }
    else { setPromoError('Invalid code. Try PRETTY15'); setPromoApplied(false) }
  }

  return (
    <>
      <div onClick={() => dispatch(closeCart())} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 301, width: 'min(420px, 100vw)', background: '#FAF7F2', boxShadow: '-8px 0 40px rgba(44,26,14,0.15)', display: 'flex', flexDirection: 'column' }} className="animate-slide-right">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>Your Cart</div>
            <div style={{ fontSize: 12, color: '#9C7A63', marginTop: 2 }}>{items.length === 0 ? 'Empty' : `${items.reduce((s, i) => s + i.qty, 0)} items`}</div>
          </div>
          <button onClick={() => dispatch(closeCart())} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Free shipping bar */}
        {items.length > 0 && subtotal < FREE_SHIPPING_AT && (
          <div style={{ padding: '12px 24px', background: '#F5EEE6', flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#6B4F3A', marginBottom: 6, fontWeight: 500 }}>Add <b style={{ color: TC }}>₹{(FREE_SHIPPING_AT - subtotal).toFixed(0)}</b> more for free shipping 🚚</div>
            <div style={{ height: 6, background: '#EDE4D8', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: TC, borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}
        {items.length > 0 && subtotal >= FREE_SHIPPING_AT && (
          <div style={{ padding: '10px 24px', background: '#EAF2E8', fontSize: 12, color: '#4A8A3A', fontWeight: 600, flexShrink: 0 }}>✓ You've unlocked free shipping! 🎉</div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your cart is empty</div>
              <div style={{ color: '#9C7A63', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Add some handcrafted gifts to get started</div>
              <button onClick={() => dispatch(closeCart())} style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Browse Gifts →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: item.product.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{item.product.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{item.product.category}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{item.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#F5EEE6', borderRadius: 99, overflow: 'hidden' }}>
                        <button onClick={() => dispatch(updateLocal({ idx, qty: item.qty - 1 }))} style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => dispatch(updateLocal({ idx, qty: item.qty + 1 }))} style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontWeight: 700, color: TC, fontSize: 15 }}>₹{(item.product.price * item.qty).toFixed(2)}</div>
                    </div>
                    <button onClick={() => saveForLater(idx)} style={{ marginTop: 7, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9C7A63', padding: 0, fontWeight: 600 }}>Save for later</button>
                  </div>
                  <button onClick={() => dispatch(removeLocal(idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B5A5', fontSize: 18, padding: 4, flexShrink: 0, marginTop: -2, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {savedItems.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Saved for Later</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savedItems.map((p) => (
                  <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px', background: '#F7F3EE', borderRadius: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: p.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E' }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: TC, fontWeight: 700 }}>₹{p.price}</div>
                    </div>
                    <button onClick={() => moveToCart(p)} style={{ padding: '6px 12px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Move to Cart</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && items.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>You might also love</div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                {suggestions.map((p) => (
                  <div key={p.id} style={{ flexShrink: 0, width: 130, background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #EDE4D8' }}>
                    <div style={{ height: 80, background: p.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{p.emoji}</div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 6 }}>{p.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: TC }}>₹{p.price}</span>
                        <button onClick={() => dispatch(addLocal(p))} style={{ padding: '4px 8px', borderRadius: 99, border: 'none', background: '#F5EEE6', color: TC, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '16px 24px 28px', borderTop: '1px solid #EDE4D8', flexShrink: 0, background: '#FAF7F2' }}>
            <div onClick={() => setGiftWrap(g => !g)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: `1.5px solid ${giftWrap ? TC : '#EDE4D8'}`, background: giftWrap ? '#FDF6F1' : 'white', cursor: 'pointer', marginBottom: 14, transition: 'all 0.2s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5EEE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎀</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Premium Gift Wrapping</div>
                <div style={{ fontSize: 11, color: '#9C7A63' }}>Kraft paper, ribbon bow & handwritten card</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: giftWrap ? TC : '#9C7A63' }}>+₹4</span>
                <div style={{ width: 40, height: 22, borderRadius: 99, background: giftWrap ? TC : '#EDE4D8', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: giftWrap ? 21 : 3, transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={promo} onChange={(e) => { setPromo(e.target.value); setPromoError('') }} placeholder="Promo code (try PRETTY15)"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #EDE4D8', fontSize: 13, background: '#FDFAF7', color: '#2C1A0E', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = TC} onBlur={(e) => e.target.style.borderColor = promoApplied ? '#7A9A6B' : '#EDE4D8'} />
              <button onClick={applyPromo} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: promoApplied ? '#7A9A6B' : TC, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {promoApplied ? '✓ Applied' : 'Apply'}
              </button>
            </div>
            {promoError && <div style={{ fontSize: 12, color: '#C44A4A', marginBottom: 10, marginTop: -8 }}>{promoError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
              {discount > 0 && <Row label="Discount (15%)" value={`−₹${discount.toFixed(2)}`} color="#7A9A6B" />}
              {giftWrap && <Row label="Gift Wrapping" value="+₹4.00" />}
              <Row label="Shipping" value={shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`} color={shipping === 0 ? '#7A9A6B' : undefined} />
              <div style={{ height: 1, background: '#EDE4D8', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>
                <span>Total</span><span style={{ color: TC }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={() => { dispatch(closeCart()); dispatch(openCheckout()) }}
              style={{ width: '100%', padding: '15px', borderRadius: 99, border: 'none', background: `linear-gradient(135deg, ${TC}, #A85A38)`, color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 6px 20px rgba(196,112,74,0.35)', minHeight: 52 }}>
              Checkout — ₹{total.toFixed(2)} →
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#C5B5A5', marginTop: 10 }}>🔒 Secure checkout · Free returns</div>
          </div>
        )}
      </div>
    </>
  )
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: color || '#6B4F3A' }}>
      <span>{label}</span><span style={color ? { fontWeight: 600 } : {}}>{value}</span>
    </div>
  )
}
