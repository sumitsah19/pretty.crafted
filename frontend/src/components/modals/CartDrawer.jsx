import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, selectCoupon, setCoupon, clearCoupon, updateLocal, removeLocal, addLocal, removeBox } from '../../store/slices/cartSlice'
import { openCheckout, closeCart } from '../../store/slices/uiSlice'
import { selectProducts } from '../../store/slices/productsSlice'
import { giftBoxApi, couponApi } from '../../api/services'

const TC = '#C4704A'

const SAVED_KEY = 'pc_saved_for_later'

const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || [] } catch { return [] }
}

export default function CartDrawer() {
  const dispatch = useDispatch()
  const { items, boxes } = useSelector(selectCart)
  const coupon = useSelector(selectCoupon) // shared with checkout via Redux
  const products = useSelector(selectProducts)
  // Persisted so saved items survive the drawer unmounting (and page reloads),
  // instead of being silently discarded when the drawer closes.
  const [savedItems, setSavedItems] = useState(loadSaved)
  // Coupon: the typed code and feedback; the validated coupon itself lives in Redux.
  const [couponInput, setCouponInput] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems)) } catch { /* quota/full — non-critical */ }
  }, [savedItems])

  // Close on Escape + lock body scroll while open (restoring whatever was set before)
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') dispatch(closeCart()) }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [dispatch])

  const isEmpty = items.length === 0 && boxes.length === 0
  const boxesTotal = boxes.reduce((s, b) => s + Number(b.totalPrice || 0), 0)
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0) + boxesTotal

  const removeGiftBox = async (id) => {
    dispatch(removeBox(id))
    try { await giftBoxApi.remove(id) } catch { /* already removed locally; server row is cleaned up on next sync */ }
  }
  // Discount mirrors the server's redeem() math (round to paise, HALF_UP) so the
  // amount shown here matches checkout and what the backend actually charges.
  const discount = coupon ? Math.round(subtotal * coupon.discountPercent) / 100 : 0
  // No client-side fees: delivery is free and the server computes the order total,
  // so the drawer total must equal the checkout total (= subtotal − discount).
  const total = Math.max(0, subtotal - discount)

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return
    setCouponBusy(true)
    setCouponMsg('')
    try {
      const { data } = await couponApi.validate(code)
      dispatch(setCoupon({ code: data.code, discountPercent: data.discountPercent }))
      setCouponMsg(`${data.code} applied — ${data.discountPercent}% off`)
    } catch (err) {
      dispatch(clearCoupon())
      setCouponMsg(err.response?.data?.message || 'That code is not valid.')
    } finally {
      setCouponBusy(false)
    }
  }

  const removeCoupon = () => {
    dispatch(clearCoupon())
    setCouponInput('')
    setCouponMsg('')
  }

  const suggestions = products.filter((p) => p.tag === 'Bestseller' && !items.find((i) => i.product.id === p.id)).slice(0, 3)

  const saveForLater = (productId) => {
    const item = items.find((i) => i.product.id === productId)
    if (item) setSavedItems((prev) => [...prev, item.product])
    dispatch(removeLocal(productId))
  }
  const moveToCart = (p) => {
    setSavedItems((prev) => prev.filter((x) => x.id !== p.id))
    dispatch(addLocal(p))
  }

  return (
    <>
      <div onClick={() => dispatch(closeCart())} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(44,26,14,0.4)', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1201, width: 'min(420px, 100vw)', background: '#FAF7F2', boxShadow: '-8px 0 40px rgba(44,26,14,0.15)', display: 'flex', flexDirection: 'column' }} className="animate-slide-right">
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>Your Cart</div>
            <div style={{ fontSize: 12, color: '#9C7A63', marginTop: 2 }}>{isEmpty ? 'Empty' : `${items.reduce((s, i) => s + i.qty, 0) + boxes.length} items`}</div>
          </div>
          <button onClick={() => dispatch(closeCart())} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Free delivery note */}
        {!isEmpty && (
          <div style={{ padding: '10px 24px', background: '#EAF2E8', fontSize: 12, color: '#4A8A3A', fontWeight: 600, flexShrink: 0 }}>✓ Free delivery on every order 🚚</div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {isEmpty ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your cart is empty</div>
              <div style={{ color: '#9C7A63', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Add some handcrafted gifts to get started</div>
              <button onClick={() => dispatch(closeCart())} style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: TC, color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Browse Gifts →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => (
                <div key={item.product.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(44,26,14,0.06)' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: item.product.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{item.product.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#9C7A63', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{item.product.category}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 }}>{item.product.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#F5EEE6', borderRadius: 99, overflow: 'hidden' }}>
                        <button onClick={() => dispatch(updateLocal({ productId: item.product.id, qty: item.qty - 1 }))} style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => dispatch(updateLocal({ productId: item.product.id, qty: item.qty + 1 }))} style={{ width: 30, height: 30, border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontWeight: 700, color: TC, fontSize: 15 }}>₹{(item.product.price * item.qty).toFixed(2)}</div>
                    </div>
                    <button onClick={() => saveForLater(item.product.id)} style={{ marginTop: 7, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#9C7A63', padding: 0, fontWeight: 600 }}>Save for later</button>
                  </div>
                  <button onClick={() => dispatch(removeLocal(item.product.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B5A5', fontSize: 18, padding: 4, flexShrink: 0, marginTop: -2, lineHeight: 1 }}>×</button>
                </div>
              ))}

              {/* Gift boxes */}
              {boxes.map((box) => (
                <div key={`box-${box.id}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px', background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(44,26,14,0.06)', border: `1.5px solid ${TC}22` }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: box.boxImageUrl ? `#FDF6F1 url(${box.boxImageUrl}) center/cover` : '#FDF6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{box.boxImageUrl ? '' : '🎁'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: TC, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Custom Gift Box</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{box.boxTitle ? `${box.boxTitle} · ` : ''}{box.size} Box · {box.items?.length || 0} items</div>
                    {box.customMessage && <div style={{ fontSize: 11, color: '#9C7A63', fontStyle: 'italic', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{box.customMessage}"</div>}
                    <div style={{ fontWeight: 700, color: TC, fontSize: 15 }}>₹{Number(box.totalPrice).toFixed(2)}</div>
                  </div>
                  <button onClick={() => removeGiftBox(box.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B5A5', fontSize: 18, padding: 4, flexShrink: 0, marginTop: -2, lineHeight: 1 }}>×</button>
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
        {!isEmpty && (
          <div style={{ padding: '16px 24px 28px', borderTop: '1px solid #EDE4D8', flexShrink: 0, background: '#FAF7F2' }}>

            {/* Coupon — applied here so the discounted total shows before checkout */}
            <div style={{ marginBottom: 14 }}>
              {coupon ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', background: '#EAF2E8', borderRadius: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7A9A6B', letterSpacing: '0.04em' }}>✓ {coupon.code}</span>
                    <span style={{ fontSize: 12, color: '#6B4F3A' }}>{coupon.discountPercent}% off</span>
                  </span>
                  <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9C7A63', fontWeight: 600, padding: 0, flexShrink: 0 }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                    placeholder="Coupon code"
                    style={{ flex: 1, minWidth: 0, padding: '11px 14px', borderRadius: 10, fontSize: 13, border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E', outline: 'none', fontFamily: "'DM Sans',sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'border-color 0.2s' }}
                    onFocus={(e) => (e.target.style.borderColor = TC)} onBlur={(e) => (e.target.style.borderColor = '#EDE4D8')}
                  />
                  <button onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}
                    style={{ flexShrink: 0, padding: '0 18px', borderRadius: 10, border: 'none', background: couponBusy || !couponInput.trim() ? '#EDE4D8' : TC, color: couponBusy || !couponInput.trim() ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 13, cursor: couponBusy || !couponInput.trim() ? 'default' : 'pointer' }}>
                    {couponBusy ? '…' : 'Apply'}
                  </button>
                </div>
              )}
              {couponMsg && <div style={{ fontSize: 12, marginTop: 7, color: coupon ? '#7A9A6B' : '#C44A4A' }}>{couponMsg}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
              {discount > 0 && <Row label={`Discount (${coupon.code})`} value={`−₹${discount.toFixed(2)}`} color="#7A9A6B" />}
              <Row label="Delivery" value="FREE" color="#7A9A6B" />
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
