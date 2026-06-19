import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectCart, clearCart, removeBox, removeLocal } from '../../store/slices/cartSlice'
import { closeCheckout, openLogin } from '../../store/slices/uiSlice'
import { selectIsLoggedIn } from '../../store/slices/authSlice'
import { ordersApi, cartApi, couponApi, giftBoxApi, addressApi } from '../../api/services'
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
  // Coupon: the typed code, the server-validated coupon, and feedback.
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // { code, discountPercent }
  const [couponMsg, setCouponMsg] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  // Saved address book: prefill the form from the default, and let the user
  // pick another instead of re-typing. `null` selectedAddrId = "new address".
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddrId, setSelectedAddrId] = useState(null)

  useEffect(() => { analytics.checkoutStart() }, [])
  useEffect(() => { analytics.checkoutStep(step) }, [step])

  // Close on Escape (never mid-payment, nor while login is stacked on top) + lock body scroll
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape' && !placing && !showLogin) { if (placed) dispatch(clearCart()); dispatch(closeCheckout()) } }
    window.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [dispatch, placing, showLogin, placed])

  const boxesTotal = boxes.reduce((s, b) => s + Number(b.totalPrice || 0), 0)
  const subtotalItems = items.reduce((s, i) => s + i.product.price * i.qty, 0) + boxesTotal
  // Discount mirrors the server's redeem() math (round to paise, HALF_UP) so the
  // amount shown here matches what the backend actually charges.
  const discount = coupon
    ? Math.round(subtotalItems * coupon.discountPercent) / 100
    : 0
  const total = Math.max(0, subtotalItems - discount)

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return
    setCouponBusy(true)
    setCouponMsg('')
    try {
      const { data } = await couponApi.validate(code)
      setCoupon({ code: data.code, discountPercent: data.discountPercent })
      setCouponMsg(`${data.code} applied — ${data.discountPercent}% off`)
    } catch (err) {
      setCoupon(null)
      setCouponMsg(err.response?.data?.message || 'That code is not valid.')
    } finally {
      setCouponBusy(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponInput('')
    setCouponMsg('')
  }

  // Tracks whether the user has manually typed into the form, so the address-book
  // prefill never overwrites their own input. Written only from event handlers.
  const touchedRef = useRef(false)
  const setA = (k, v) => { touchedRef.current = true; setAddr((p) => ({ ...p, [k]: v })) }
  const addrValid = addr.name && addr.phone && addr.line1 && addr.city && addr.zip

  // Map a saved AddressDto onto the checkout form shape.
  const fillFromSaved = (a) => setAddr({
    name: a.recipientName || '', phone: a.phone || '',
    line1: a.line1 || '', line2: a.line2 || '',
    city: a.city || '', state: a.state || '',
    zip: a.zip || '', country: a.country || 'India',
  })

  // Load the address book once signed in; prefill from the default so the
  // returning customer rarely retypes anything.
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false
    addressApi.list()
      .then(({ data }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setSavedAddresses(list)
        // Only auto-fill an untouched form — never clobber what the user already
        // typed (e.g. they entered an address while logged out, then signed in).
        const def = list.find((a) => a.isDefault) || list[0]
        if (def && !touchedRef.current) { setSelectedAddrId(def.id); fillFromSaved(def) }
      })
      .catch(() => { /* address book unavailable — manual entry still works */ })
    return () => { cancelled = true }
  }, [isLoggedIn])
  const payValid = payMethod === 'cod' || payMethod === 'online'

  const inputSt = { width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13, border: '1.5px solid #EDE4D8', background: '#FDFAF7', color: '#2C1A0E', outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color 0.2s' }
  const focus = (e) => e.target.style.borderColor = TC
  const blur = (e) => e.target.style.borderColor = '#EDE4D8'

  // What the current checkout attempt depends on; if any of it changes, a previously
  // created (unpaid) order is stale and a fresh one must be created.
  const checkoutSig = JSON.stringify([items.map((i) => [i.product.id, i.qty]), boxes.map((b) => b.id), addr, coupon?.code || null])

  // Reconcile the local cart's gift boxes against the server's IN_CART boxes
  // (the set the order is actually built from). Returns true if it's safe to
  // place; false if something changed and the user should re-review.
  const reconcileBoxes = async () => {
    let serverBoxes
    try {
      const { data } = await giftBoxApi.list()
      serverBoxes = Array.isArray(data) ? data : []
    } catch {
      // Can't verify. If the cart actually has boxes, fail safe rather than risk
      // charging for a removed one. If it has none, a transient gift-box service
      // blip must not block a product-only checkout — proceed (there's nothing
      // local to charge; any stray server box is cleaned on a later successful run).
      if (boxes.length === 0) return true
      setOrderError('Could not verify your gift boxes. Please try again.')
      return false
    }

    const serverIds = new Set(serverBoxes.map((b) => b.id))
    const localIds = new Set(boxes.map((b) => b.id))

    // Boxes the user removed locally whose server delete never landed — delete
    // them now so they aren't silently ordered and charged.
    const orphaned = serverBoxes.filter((b) => !localIds.has(b.id))
    for (const b of orphaned) {
      try { await giftBoxApi.remove(b.id) } catch { /* best effort; re-checked below */ }
    }

    // Boxes in the local cart that no longer exist server-side — can't be
    // ordered. Drop them locally and ask the user to review.
    const vanished = boxes.filter((b) => !serverIds.has(b.id))
    if (vanished.length > 0) {
      vanished.forEach((b) => dispatch(removeBox(b.id)))
      setOrderError('Some gift boxes in your cart are no longer available and were removed. Please review your order.')
      return false
    }
    return true
  }

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
        // Make sure the server's gift boxes match the cart before the order is
        // built from them — a box removed locally must not be charged, and a box
        // that vanished server-side must not be silently ordered. Always run this,
        // even with no local boxes: the order is built from the server's IN_CART
        // set, so a stray box (a delete that never landed) would otherwise be
        // silently ordered and charged.
        const ok = await reconcileBoxes()
        if (!ok) { setPlacing(false); return }

        // Non-destructive cart sync: fetch server cart and apply minimal diffs
        const serverRes = await cartApi.get()
        const serverItems = serverRes.data?.items || []

        const serverByProduct = new Map()
        for (const si of serverItems) serverByProduct.set(Number(si.productId), si)

        const localByProduct = new Map()
        for (const li of items) localByProduct.set(Number(li.product.id), li.qty)

        // Add or update local items on server. A product deleted from the catalog
        // since it was added to the cart 404s here — drop it locally and flag for
        // review rather than aborting the whole checkout with an opaque
        // "Product not found" error the user can't act on.
        const vanishedItems = []
        for (const [productId, qty] of localByProduct.entries()) {
          const serverItem = serverByProduct.get(productId)
          try {
            if (serverItem) {
              if (serverItem.quantity !== qty) {
                await cartApi.update(serverItem.id, qty)
              }
              serverByProduct.delete(productId)
            } else {
              await cartApi.add(productId, qty)
            }
          } catch (e) {
            if (e.response?.status === 404) {
              vanishedItems.push(productId)
              dispatch(removeLocal(productId))
              serverByProduct.delete(productId)
            } else {
              throw e
            }
          }
        }

        if (vanishedItems.length > 0) {
          setOrderError('Some items in your cart are no longer available and were removed. Please review your order.')
          setPlacing(false)
          return
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
          couponCode: coupon?.code || undefined,
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
                  // Backend's VerifyPaymentRequest binds snake_case keys (@JsonProperty),
                  // which is also exactly how Razorpay names them — pass them through as-is.
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
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

  // Single close path for ×, Escape and backdrop. Never closes mid-payment or
  // while login is stacked on top; and if the order succeeded, closing here
  // clears the local cart too (otherwise the wiped server cart and the still-full
  // local cart desync, and the next checkout re-adds everything → duplicate order).
  const handleClose = () => {
    if (placing || showLogin) return
    if (placed) dispatch(clearCart())
    dispatch(closeCheckout())
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      <div style={{ background: '#FAF7F2', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(44,26,14,0.25)' }} className="animate-fade-up">

        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #EDE4D8', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: placed ? 0 : 16 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700 }}>{placed ? 'Order Confirmed! 🎉' : 'Checkout'}</div>
            <button onClick={handleClose} disabled={placing} style={{ background: '#F5EEE6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: placing ? 'default' : 'pointer', fontSize: 18, color: '#6B4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: placing ? 0.5 : 1 }}>×</button>
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

              {/* Saved address picker — only when the customer has any */}
              {savedAddresses.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
                  {savedAddresses.map((a) => {
                    const sel = selectedAddrId === a.id
                    return (
                      <button key={a.id} type="button"
                        onClick={() => { setSelectedAddrId(a.id); fillFromSaved(a) }}
                        style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${sel ? TC : '#EDE4D8'}`, background: sel ? '#FDF5F0' : 'white', cursor: 'pointer' }}>
                        <span style={{ marginTop: 1, width: 16, height: 16, borderRadius: '50%', border: `2px solid ${sel ? TC : '#D9CBBF'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {sel && <span style={{ width: 8, height: 8, borderRadius: '50%', background: TC }} />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>{a.label || 'Address'}</span>
                            {a.isDefault && <span style={{ fontSize: 9, fontWeight: 700, color: TC, background: '#FDF6F1', padding: '1px 7px', borderRadius: 99 }}>Default</span>}
                          </span>
                          <span style={{ display: 'block', fontSize: 11, color: '#9C7A63', lineHeight: 1.5 }}>
                            {a.recipientName} · {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.zip}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  <button type="button"
                    onClick={() => { setSelectedAddrId(null); setAddr({ name: '', phone: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'India' }) }}
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 12, border: `1.5px dashed ${selectedAddrId === null ? TC : '#D9CBBF'}`, background: 'white', color: selectedAddrId === null ? TC : '#9C7A63', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    + Use a new address
                  </button>
                </div>
              )}

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
                  {/* India only: pricing is ₹/INR and we ship within India. */}
                  <select value={addr.country} onChange={(e) => setA('country', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
                    <option>India</option>
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
              {/* Coupon */}
              <div style={{ padding: '14px 16px', background: 'white', borderRadius: 14, border: '1px solid #EDE4D8' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9C7A63', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Have a coupon?</div>
                {coupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#7A9A6B', background: '#EAF2E8', borderRadius: 99, padding: '5px 12px', letterSpacing: '0.04em' }}>✓ {coupon.code}</span>
                      <span style={{ fontSize: 12, color: '#6B4F3A' }}>{coupon.discountPercent}% off</span>
                    </div>
                    <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9C7A63', fontWeight: 600, padding: 0 }}>Remove</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                      placeholder="Enter code"
                      style={{ ...inputSt, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      onFocus={focus} onBlur={blur}
                    />
                    <button onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}
                      style={{ flexShrink: 0, padding: '0 18px', borderRadius: 10, border: 'none', background: couponBusy || !couponInput.trim() ? '#EDE4D8' : TC, color: couponBusy || !couponInput.trim() ? '#9C7A63' : 'white', fontWeight: 700, fontSize: 13, cursor: couponBusy || !couponInput.trim() ? 'default' : 'pointer' }}>
                      {couponBusy ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponMsg && (
                  <div style={{ fontSize: 12, marginTop: 8, color: coupon ? '#7A9A6B' : '#C44A4A' }}>{couponMsg}</div>
                )}
              </div>

              <div style={{ padding: '12px 16px', background: '#F5EEE6', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#6B4F3A' }}><span>Subtotal</span><span>₹{subtotalItems.toFixed(2)}</span></div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, color: '#7A9A6B', fontWeight: 600 }}><span>Discount ({coupon.code})</span><span>−₹{discount.toFixed(2)}</span></div>
                )}
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
