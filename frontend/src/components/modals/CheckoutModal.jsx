import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, clearCart } from '../../store/slices/cartSlice'
import { closeCheckout, openLogin } from '../../store/slices/uiSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { ordersApi, cartApi } from '../../api/services'
import { analytics } from '../../analytics'

const TC = '#C4704A'
const STEPS = ['Address', 'Payment', 'Review']
const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let razorpayScriptPromise

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_CHECKOUT_URL
    script.async = true
    script.onload = resolve
    script.onerror = () => {
      razorpayScriptPromise = null
      reject(new Error('Unable to load Razorpay checkout. Please check your connection and try again.'))
    }
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export default function CheckoutModal() {
  const dispatch = useDispatch()
  const { items, boxes } = useSelector(selectCart)
  const isLoggedIn = useSelector(selectIsLoggedIn)
  const showLogin = useSelector(s => s.ui.showLogin) // login can open ON TOP of checkout
  const [step, setStep] = useState(1)
  const [addr, setAddr] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'India' })
  const [payMethod, setPayMethod] = useState('online')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [serverOrderId, setServerOrderId] = useState(null)
  // An order created on a previous attempt whose Razorpay payment wasn't completed
  // (popup dismissed, payment failed…). Reused on retry so we never create duplicates.
  const [pendingOrder, setPendingOrder] = useState(null) // { res, sig }
  // Set when "Place Order" was interrupted by login; the order resumes once logged in.
  const [pendingPlace, setPendingPlace] = useState(false)

  useEffect(() => { analytics.checkoutStart() }, [])
  useEffect(() => { analytics.checkoutStep(step) }, [step])

  // Close on Escape (never mid-payment, nor while login is stacked on top) + lock body scroll
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && !placing && !showLogin) dispatch(closeCheckout()) }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [dispatch, placing, showLogin])

  const boxesTotal = boxes.reduce((s, b) => s + Number(b.totalPrice || 0), 0)
  const subtotalItems = items.reduce((s, i) => s + i.product.price * i.qty, 0) + boxesTotal
  const total = subtotalItems

  const setA = (k, v) => setAddr((p) => ({ ...p, [k]: v }))
  const addrValid = addr.name && addr.phone && addr.line1 && addr.city && addr.zip
  const payValid = payMethod === 'cod' || payMethod === 'online'

  const inputSt = { width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13, border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E', outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s' }
  const focus = (e) => e.target.style.borderColor = TC
  const blur = (e) => e.target.style.borderColor = '#EDE4D8'

  // What the current checkout attempt depends on; if any of it changes, a previously
  // created (unpaid) order is stale and a fresh one must be created.
  const checkoutSig = JSON.stringify([items.map((i) => [i.product.id, i.qty]), boxes.map((b) => b.id), addr])

  const placeOrder = async () => {
    if (!isLoggedIn) {
      // Keep checkout mounted so the address/step survive; login opens on top
      // (zIndex 1300) and the order resumes automatically once signed in.
      setPendingPlace(true)
      dispatch(openLogin())
      return
    }
    if (items.length === 0 && boxes.length === 0) {
      setOrderError('Your cart is empty — add something first.')
      return
    }
    // Demo items only exist in the local catalog fallback, not in the backend —
    // syncing their ids to the server cart would fail with confusing errors.
    if (items.some((i) => i.product.demo)) {
      setOrderError('Some items in your cart are showcase samples and cannot be purchased yet. Please remove them and try again.')
      return
    }

    setPlacing(true)
    setOrderError('')

    try {
      const backendPaymentMethod = payMethod === 'cod' ? 'COD' : 'RAZORPAY'

      // Reuse the order from a previous attempt (e.g. the Razorpay popup was dismissed)
      // as long as the cart and address haven't changed — avoids duplicate orders.
      let res
      if (backendPaymentMethod === 'RAZORPAY' && pendingOrder?.sig === checkoutSig) {
        res = pendingOrder.res
      } else {
        // Non-destructive cart sync: fetch server cart and apply minimal diffs
        const serverRes = await cartApi.get()
        const serverItems = serverRes.data?.items || []

        const serverByProduct = new Map()
        for (const si of serverItems) serverByProduct.set(Number(si.productId), si)

        const localByProduct = new Map()
        for (const li of items) localByProduct.set(Number(li.product.id), li.qty)

        // Add or update local items on server
        for (const [productId, qty] of localByProduct.entries()) {
          const serverItem = serverByProduct.get(productId)
          if (serverItem) {
            if (serverItem.quantity !== qty) {
              await cartApi.update(serverItem.id, qty)
            }
            serverByProduct.delete(productId)
          } else {
            await cartApi.add(productId, qty)
          }
        }

        // Any remaining server items are not present locally — remove them
        for (const si of serverByProduct.values()) {
          await cartApi.remove(si.id)
        }

        const shippingAddress = [
          addr.name, addr.line1, addr.line2,
          addr.city, addr.state, addr.zip, addr.country,
        ].filter(Boolean).join(', ')

        res = await ordersApi.create({
          shippingAddress,
          contactPhone: addr.phone,
          paymentMethod: backendPaymentMethod,
        })
        if (backendPaymentMethod === 'RAZORPAY') {
          setPendingOrder({ res, sig: checkoutSig })
        }
      }

      const order = res.data?.order
      const orderId = order?.id || res.data?.id || res.data?.orderNumber || null
      setServerOrderId(orderId)

      if (backendPaymentMethod === 'RAZORPAY') {
        if (!order?.razorpayOrderId || !res.data?.razorpayKeyId) {
          throw new Error('Payment gateway did not return the required Razorpay details.')
        }

        await loadRazorpayScript()

        await new Promise((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: res.data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: Math.round(Number(order.totalAmount || total) * 100),
            currency: 'INR',
            name: 'Prettycrafted',
            description: `Order #${orderId}`,
            order_id: order.razorpayOrderId,
            prefill: {
              name: addr.name,
              contact: addr.phone,
            },
            notes: {
              orderId: String(orderId),
            },
            theme: {
              color: TC,
            },
            handler: async (response) => {
              try {
                await ordersApi.verifyPayment(orderId, {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
                resolve()
              } catch (verifyErr) {
                reject(verifyErr)
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment was cancelled before completion.')),
            },
          })

          checkout.on('payment.failed', (response) => {
            reject(new Error(response.error?.description || 'Payment failed. Please try again.'))
          })

          checkout.open()
        })

        // Payment verified — the pending order is settled, nothing to reuse anymore.
        setPendingOrder(null)
      }

      analytics.orderPlaced(orderId, total)
      setPlacing(false)
      setPlaced(true)
    } catch (err) {
      setPlacing(false)
      setOrderError(err.response?.data?.message || err.message || 'Failed to place order. Please try again.')
    }
  }

  const placeOrderRef = useRef()
  // eslint-disable-next-line react-hooks/refs
  placeOrderRef.current = placeOrder
  useEffect(() => {
    if (!pendingPlace) return
    if (isLoggedIn) {
      // Deferred a tick: resuming is an async side effect of the login completing.
      const t = setTimeout(() => { setPendingPlace(false); placeOrderRef.current() }, 0)
      return () => clearTimeout(t)
    }
    if (!showLogin) {
      // Login dismissed without signing in — don't place a surprise order later.
      const t = setTimeout(() => setPendingPlace(false), 0)
      return () => clearTimeout(t)
    }
  }, [pendingPlace, isLoggedIn, showLogin])

  const handleSuccess = () => {
    dispatch(clearCart())
    dispatch(closeCheckout())
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !placing && !showLogin && dispatch(closeCheckout())}>
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

          {/* STEP 2: PAYMENT (moved up) */}
          {step === 2 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>Payment Method</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${payMethod === 'online' ? TC : '#EDE4D8'}`, background: payMethod === 'online' ? '#FDF5F0' : 'white', cursor: 'pointer' }}>
                  <input type="radio" checked={payMethod === 'online'} onChange={() => setPayMethod('online')} style={{ accentColor: TC, width: 16, height: 16 }} />
                  <span style={{ fontSize: 20 }}>💳</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>Cards / UPI</div>
                    <div style={{ fontSize: 10, color: '#9C7A63', marginTop: 1 }}>via Razorpay</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${payMethod === 'cod' ? TC : '#EDE4D8'}`, background: payMethod === 'cod' ? '#FDF5F0' : 'white', cursor: 'pointer' }}>
                  <input type="radio" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} style={{ accentColor: TC, width: 16, height: 16 }} />
                  <span style={{ fontSize: 20 }}>💵</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>Cash on Delivery</div>
                  </div>
                </label>
              </div>

              {/* no inline inputs or notices for online payments */}
            </div>
          )}

          {/* previous Payment section moved above as step 2 */}

          {/* STEP 3: REVIEW */}
          {step === 3 && !placed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 600 }}>Review Your Order</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'white', borderRadius: 12, border: '1px solid #EDE4D8' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: item.product.bg || '#EDE4D8', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: 11, color: '#9C7A63' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: TC, fontSize: 14 }}>₹{(item.product.price * item.qty).toFixed(2)}</div>
                  </div>
                ))}
                {boxes.map((box) => (
                  <div key={`box-${box.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'white', borderRadius: 12, border: `1px solid ${TC}22` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: box.boxImageUrl ? `#FDF6F1 url(${box.boxImageUrl}) center/cover` : '#FDF6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{box.boxImageUrl ? '' : '🎁'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{box.boxTitle ? `${box.boxTitle} · ` : ''}{box.size} Gift Box</div>
                      <div style={{ fontSize: 11, color: '#9C7A63' }}>{box.items?.length || 0} items</div>
                    </div>
                    <div style={{ fontWeight: 700, color: TC, fontSize: 14 }}>₹{Number(box.totalPrice).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 16px', background: 'white', borderRadius: 14, border: '1px solid #EDE4D8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Delivering to</div>
                <div style={{ fontSize: 13, color: '#2C1A0E', lineHeight: 1.7 }}>{addr.name}<br />{addr.line1}{addr.line2 ? ', ' + addr.line2 : ''}<br />{addr.city}{addr.state ? ', ' + addr.state : ''} {addr.zip}, {addr.country}</div>
              </div>
              <div style={{ padding: '12px 16px', background: '#F5EEE6', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#6B4F3A' }}><span>Subtotal</span><span>₹{subtotalItems.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#6B4F3A' }}><span>Delivery</span><span style={{ color: '#7A9A6B', fontWeight: 600 }}>Free</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EDE4D8', paddingTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>Total</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: TC }}>₹{total.toFixed(2)}</div>
                </div>
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
                {serverOrderId && <div>🔖 Order <b style={{ color: TC }}>#{serverOrderId}</b></div>}
                <div>📦 Delivering to: <b>{addr.city}, {addr.country}</b></div>
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
              {step < 3 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !addrValid}
                  style={{ flex: 2, padding: '13px', borderRadius: 99, border: 'none', background: (step === 1 ? addrValid : true) ? TC : '#EDE4D8', color: (step === 1 ? addrValid : true) ? 'white' : '#9C7A63', fontWeight: 700, fontSize: 14, cursor: (step === 1 ? addrValid : true) ? 'pointer' : 'default', minHeight: 48 }}>
                  {step === 1 ? 'Continue to Payment →' : 'Review Order →'}
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
