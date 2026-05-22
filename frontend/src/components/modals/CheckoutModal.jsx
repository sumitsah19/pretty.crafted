import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, clearCart } from '../../store/slices/cartSlice'
import { closeCheckout, openLogin } from '../../store/slices/uiSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { ordersApi, cartApi } from '../../api/services'

const TC = '#C4704A'
const STEPS = ['Address', 'Delivery', 'Payment', 'Review']
const DELIVERY_OPTIONS = [
  { key: 'standard', label: 'Standard Delivery', eta: '3–5 business days', price: 5.99, icon: '🚚' },
  { key: 'express',  label: 'Express Delivery',  eta: '1–2 business days', price: 9.99,  icon: '⚡' },
  { key: 'sameday', label: 'Same-Day Delivery',  eta: 'Today by 8 PM',     price: 19.99, icon: '🏎️' },
]

export default function CheckoutModal() {
  const dispatch = useDispatch()
  const { items } = useSelector(selectCart)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const [step, setStep] = useState(1)
  const [addr, setAddr] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'India' })
  const [delivery, setDelivery] = useState('standard')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [payMethod, setPayMethod] = useState('card')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [serverOrderId, setServerOrderId] = useState(null)
  const [upiId, setUpiId] = useState('')

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0)
  const deliveryFee = delivery === 'express' ? 9.99 : delivery === 'sameday' ? 19.99 : (subtotal >= 60 ? 0 : 5.99)
  const total = subtotal + deliveryFee

  const setA = (k, v) => setAddr((p) => ({ ...p, [k]: v }))
  const setC = (k, v) => setCard((p) => ({ ...p, [k]: v }))
  const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const fmtExpiry = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }
  const addrValid = addr.name && addr.phone && addr.line1 && addr.city && addr.zip
  const isExpiryValid = (expiry) => {
    if (expiry.length !== 5) return false
    const [mm, yy] = expiry.split('/')
    const month = parseInt(mm, 10)
    const year = 2000 + parseInt(yy, 10)
    if (month < 1 || month > 12) return false
    const now = new Date()
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
  }
  const payValid = payMethod !== 'card' || (card.number.replace(/\s/g, '').length === 16 && card.name && isExpiryValid(card.expiry) && card.cvv.length >= 3)

  const inputSt = { width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13, border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E', outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s' }
  const focus = (e) => e.target.style.borderColor = TC
  const blur = (e) => e.target.style.borderColor = '#EDE4D8'

  const placeOrder = async () => {
    // Backend order endpoint requires authentication
    if (!isLoggedIn) {
      dispatch(closeCheckout())
      dispatch(openLogin())
      return
    }

    setPlacing(true)
    setOrderError('')

    try {
      // Step 1: Sync local cart to server atomically.
      // Clear server cart, then add all items. If any add fails, rollback by clearing again.
      await cartApi.clear()
      try {
        for (const item of items) {
          await cartApi.add(item.product.id, item.qty)
        }
      } catch (syncErr) {
        await cartApi.clear().catch(() => {})
        throw new Error('Failed to sync your cart. Please try again.')
      }

      // Step 2: Build the payload the backend expects.
      // PlaceOrderRequest: { shippingAddress, contactPhone, paymentMethod: "RAZORPAY"|"COD" }
      const shippingAddress = [
        addr.name, addr.line1, addr.line2,
        addr.city, addr.state, addr.zip, addr.country,
      ].filter(Boolean).join(', ')

      const backendPaymentMethod = payMethod === 'cod' ? 'COD' : 'RAZORPAY'

      const res = await ordersApi.create({
        shippingAddress,
        contactPhone: addr.phone,
        paymentMethod: backendPaymentMethod,
      })

      setServerOrderId(res.data?.id || res.data?.orderNumber || null)
      setPlacing(false)
      setPlaced(true)
    } catch (err) {
      setPlacing(false)
      setOrderError(err.message || err.response?.data?.message || 'Failed to place order. Please try again.')
    }
  }

  const handleSuccess = () => {
    dispatch(clearCart())
    dispatch(closeCheckout())
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && dispatch(closeCheckout())}>
      <div style={{ background: '#FAF7F2', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(44,26,14,0.25)' }} className="animate-fade-up">
        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #EDE4D8', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: placed ? 0 : 16 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{placed ? 'Order Confirmed! 🎉' : 'Checkout'}</div>
            <button onClick={() => dispatch(closeCheckout())} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          {!placed && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'contents' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: step > i + 1 ? TC : step === i + 1 ? TC : '#EDE4D8', color: step >= i + 1 ? 'white' : '#9C7A63', transition: 'all 0.3s' }}>{step > i + 1 ? '✓' : i + 1}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: step >= i + 1 ? TC : '#9C7A63', whiteSpace: 'nowrap' }}>{s}</div>
                  </div>
                  {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? TC : '#EDE4D8', margin: '0 6px 16px', transition: 'background 0.3s' }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {/* STEP 1: ADDRESS */}
          {step === 1 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Delivery Address</div>
              {[['name', 'Full Name *', 'Jane Doe'], ['phone', 'Phone Number *', '+91 98765 43210'], ['line1', 'Address Line 1 *', '123 Main Street'], ['line2', 'Address Line 2', 'Apt, Suite (optional)']].map(([k, label, ph]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input value={addr[k]} onChange={(e) => setA(k, e.target.value)} placeholder={ph} required={k !== 'line2'} style={inputSt} onFocus={focus} onBlur={blur} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['city', 'City *', 'Mumbai'], ['state', 'State', 'Maharashtra'], ['zip', 'ZIP *', '400001']].map(([k, label, ph]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>{label}</label>
                    <input value={addr[k]} onChange={(e) => setA(k, e.target.value)} placeholder={ph} required={k !== 'state'} style={inputSt} onFocus={focus} onBlur={blur} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>Country</label>
                  <select value={addr.country} onChange={(e) => setA('country', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                    {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore', 'UAE'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY */}
          {step === 2 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>Delivery Options</div>
              {DELIVERY_OPTIONS.map((opt) => (
                <label key={opt.key} onClick={() => setDelivery(opt.key)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${delivery === opt.key ? TC : '#EDE4D8'}`, background: delivery === opt.key ? '#FDF5F0' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" checked={delivery === opt.key} onChange={() => setDelivery(opt.key)} style={{ accentColor: TC }} />
                  <span style={{ fontSize: 22 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#9C7A63' }}>{opt.eta}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: opt.price === 0 ? '#7A9A6B' : TC }}>{subtotal >= 60 && opt.key === 'standard' ? 'FREE' : `₹${opt.price.toFixed(2)}`}</div>
                </label>
              ))}
              <div style={{ marginTop: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 6 }}>Preferred Delivery Date (optional)</label>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} style={{ ...inputSt, cursor: 'pointer' }} onFocus={focus} onBlur={blur} />
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>Payment Method</div>
              {[{ key: 'card', icon: '💳', label: 'Credit / Debit Card', note: 'via Razorpay' }, { key: 'upi', icon: '📱', label: 'UPI' }, { key: 'paypal', icon: '🅿️', label: 'PayPal', note: 'via Razorpay' }, { key: 'cod', icon: '💵', label: 'Cash on Delivery' }].map((m) => (
                <label key={m.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 14, border: `1.5px solid ${payMethod === m.key ? TC : '#EDE4D8'}`, background: payMethod === m.key ? '#FDF5F0' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input type="radio" checked={payMethod === m.key} onChange={() => setPayMethod(m.key)} style={{ accentColor: TC, width: 16, height: 16 }} />
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{m.label}</span>
                    {m.note && <div style={{ fontSize: 10, color: '#9C7A63', marginTop: 1 }}>{m.note}</div>}
                  </div>
                </label>
              ))}
              {payMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', background: 'white', borderRadius: 16, border: '1px solid #EDE4D8' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>Card Number</label>
                    <input value={card.number} onChange={(e) => setC('number', fmtCard(e.target.value))} placeholder="1234 5678 9012 3456" maxLength={19} style={inputSt} onFocus={focus} onBlur={blur} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>Name on Card</label>
                    <input value={card.name} onChange={(e) => setC('name', e.target.value)} placeholder="Jane Doe" style={inputSt} onFocus={focus} onBlur={blur} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>Expiry</label>
                      <input value={card.expiry} onChange={(e) => setC('expiry', fmtExpiry(e.target.value))} placeholder="MM/YY" maxLength={5} style={inputSt} onFocus={focus} onBlur={blur} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>CVV</label>
                      <input value={card.cvv} onChange={(e) => setC('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" maxLength={4} type="password" style={inputSt} onFocus={focus} onBlur={blur} />
                    </div>
                  </div>
                </div>
              )}
              {payMethod === 'upi' && (
                <div style={{ padding: '16px', background: 'white', borderRadius: 16, border: '1px solid #EDE4D8' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B4F3A', display: 'block', marginBottom: 5 }}>UPI ID</label>
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" style={inputSt} onFocus={focus} onBlur={blur} />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW */}
          {step === 4 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>Review Your Order</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'white', borderRadius: 12, border: '1px solid #EDE4D8' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: item.product.bg || '#EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{item.product.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: 11, color: '#9C7A63' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: TC, fontSize: 14 }}>₹{(item.product.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 16px', background: 'white', borderRadius: 14, border: '1px solid #EDE4D8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>📦 Delivering to</div>
                <div style={{ fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>{addr.name}<br />{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />{addr.city}{addr.state ? ', ' + addr.state : ''} {addr.zip}, {addr.country}</div>
              </div>
              <div style={{ padding: '12px 16px', background: '#F5EEE6', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#6B4F3A' }}>Order Total</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: TC }}>₹{total.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* PLACED */}
          {placed && (
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: [TC, '#7A9A6B', '#C4A44A', '#9A7A6B', '#6B9AAA'][i % 5], top: '50%', left: '50%', animation: `confetti${i % 3} 0.8s ease ${i * 0.06}s both`, transform: `rotate(${i * 30}deg) translateY(-60px)` }} />
                ))}
                <div style={{ fontSize: 72, position: 'relative', zIndex: 1 }} className="animate-bounce-in">🎁</div>
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Order Placed!</div>
              <div style={{ color: '#9C7A63', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>Thank you, <b style={{ color: '#2C1A0E' }}>{addr.name}</b>!<br />Your handcrafted gifts are on their way.</div>
              <div style={{ background: '#F5EEE6', borderRadius: 16, padding: '16px 20px', marginBottom: 20, fontSize: 13, color: '#6B4F3A', lineHeight: 2, textAlign: 'left' }}>
                <div>📦 {DELIVERY_OPTIONS.find((o) => o.key === delivery)?.label}</div>
                <div>⏱ Estimated: <b>{deliveryDate || DELIVERY_OPTIONS.find((o) => o.key === delivery)?.eta}</b></div>
                {serverOrderId && <div>🔖 Order <b style={{ color: TC }}>#{serverOrderId}</b></div>}
              </div>
              <button onClick={handleSuccess} style={{ width: '100%', padding: '14px', borderRadius: 99, border: 'none', background: `linear-gradient(135deg,${TC},#A85A38)`, color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Continue Shopping →</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!placed && (
          <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #EDE4D8', flexShrink: 0 }}>
            {orderError && (
              <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#C44A4A', marginBottom: 12 }}>
                ⚠️ {orderError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 1 && (
                <button onClick={() => setStep((s) => s - 1)} style={{ flex: 1, padding: '13px', borderRadius: 99, border: '1.5px solid #EDE4D8', background: 'none', color: '#6B4F3A', fontWeight: 600, cursor: 'pointer', fontSize: 14, minHeight: 48 }}>← Back</button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !addrValid}
                  style={{ flex: 2, padding: '13px', borderRadius: 99, border: 'none', background: (step === 1 ? addrValid : true) ? TC : '#EDE4D8', color: (step === 1 ? addrValid : true) ? 'white' : '#9C7A63', fontWeight: 700, fontSize: 14, cursor: (step === 1 ? addrValid : true) ? 'pointer' : 'default', minHeight: 48 }}>
                  {step === 1 ? 'Choose Delivery →' : step === 2 ? 'Continue to Payment →' : 'Review Order →'}
                </button>
              ) : (
                <button onClick={placeOrder} disabled={placing || !payValid}
                  style={{ flex: 2, padding: '13px', borderRadius: 99, border: 'none', background: placing || !payValid ? '#EDE4D8' : `linear-gradient(135deg, ${TC}, #A85A38)`, color: placing || !payValid ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 15, cursor: placing || !payValid ? 'default' : 'pointer', minHeight: 48, boxShadow: placing || !payValid ? 'none' : '0 6px 20px rgba(196,112,74,0.35)' }}>
                  {placing ? 'Placing Order...' : `Place Order — ₹${total.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
