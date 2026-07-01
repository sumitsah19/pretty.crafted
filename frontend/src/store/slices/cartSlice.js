import { createSlice } from '@reduxjs/toolkit'
import { fetchProducts, fetchHampers } from './productsSlice'
import { logoutThunk } from './authSlice'
import { deliveryFeeFor } from '../../utils/delivery'

const localKey = 'pc_cart'
const boxesKey = 'pc_cart_boxes'
const couponKey = 'pc_cart_coupon'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (items) => { try { localStorage.setItem(localKey, JSON.stringify(items)) } catch { /* storage unavailable — cart stays in-memory */ } }
const loadBoxes = () => { try { return JSON.parse(localStorage.getItem(boxesKey) || '[]') } catch { return [] } }
const saveBoxes = (boxes) => { try { localStorage.setItem(boxesKey, JSON.stringify(boxes)) } catch { /* storage unavailable — cart stays in-memory */ } }
const loadCoupon = () => { try { return JSON.parse(localStorage.getItem(couponKey) || 'null') } catch { return null } }
const saveCoupon = (coupon) => { try { coupon ? localStorage.setItem(couponKey, JSON.stringify(coupon)) : localStorage.removeItem(couponKey) } catch { /* storage unavailable — coupon stays in-memory */ } }

// A coupon applied to a now-empty cart is stale: it would silently re-apply to a
// different set of items the next time the cart is filled (and may have expired by
// then, only surfacing as a failed "Place Order"). Drop it once nothing remains.
const clearCouponIfEmpty = (state) => {
  if (state.coupon && state.items.length === 0 && state.boxes.length === 0) {
    state.coupon = null
    saveCoupon(null)
  }
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadLocal(),
    // Gift boxes are persisted server-side (status IN_CART). We keep the returned
    // GiftBoxDto here purely so the cart drawer & checkout can display/total them.
    boxes: loadBoxes(),
    // A server-validated coupon applied in the cart, shared with checkout so the
    // discount the customer saw in the drawer carries into the order. { code, discountPercent }
    coupon: loadCoupon(),
  },
  reducers: {
    addLocal(state, action) {
      const product = action.payload
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        existing.qty += 1
      } else {
        state.items.push({ product, qty: 1 })
      }
      saveLocal(state.items)
    },
    updateLocal(state, action) {
      const { productId, qty } = action.payload
      const idx = state.items.findIndex((i) => i.product.id === productId)
      if (idx === -1) return
      if (qty <= 0) state.items.splice(idx, 1)
      else state.items[idx].qty = qty
      saveLocal(state.items)
      clearCouponIfEmpty(state)
    },
    removeLocal(state, action) {
      const productId = action.payload
      state.items = state.items.filter((i) => i.product.id !== productId)
      saveLocal(state.items)
      clearCouponIfEmpty(state)
    },
    addBox(state, action) {
      // action.payload is the GiftBoxDto returned by the backend
      state.boxes.push(action.payload)
      saveBoxes(state.boxes)
    },
    removeBox(state, action) {
      const id = action.payload
      state.boxes = state.boxes.filter((b) => b.id !== id)
      saveBoxes(state.boxes)
      clearCouponIfEmpty(state)
    },
    setCoupon(state, action) {
      // action.payload is the validated coupon ({ code, discountPercent }) or null
      state.coupon = action.payload || null
      saveCoupon(state.coupon)
    },
    clearCoupon(state) {
      state.coupon = null
      saveCoupon(null)
    },
    clearCart(state) {
      state.items = []
      state.boxes = []
      state.coupon = null
      saveLocal([])
      saveBoxes([])
      saveCoupon(null)
    },
  },
  extraReducers: (builder) => {
    // Cart items persist a full product snapshot in localStorage, so a price/name/image
    // changed by the admin would otherwise show stale until the item is re-added. Whenever
    // fresh catalog data lands, swap in the up-to-date product for matching ids.
    // Demo payload items are skipped (their ids don't refer to real backend products),
    // and demo cart items are left untouched rather than silently swapped for real ones.
    const refreshFromCatalog = (state, action) => {
      const fresh = new Map()
      for (const p of action.payload) if (!p.demo) fresh.set(p.id, p)
      let changed = false
      for (const item of state.items) {
        if (item.product.demo) continue
        const p = fresh.get(item.product.id)
        if (p) {
          item.product = p
          changed = true
        }
      }
      if (changed) saveLocal(state.items)
    }
    // Once someone signs in, the cart is effectively account-scoped (gift boxes
    // literally reference the user's server-side rows, and checkout syncs items
    // to the account). Leaving it behind after logout would hand the next user
    // of a shared device the previous user's cart — clear it on both manual
    // logout and the forced 401 logout (both dispatch logoutThunk).
    const resetOnLogout = (state) => {
      state.items = []
      state.boxes = []
      state.coupon = null
      saveLocal([])
      saveBoxes([])
      saveCoupon(null)
    }
    builder
      .addCase(fetchProducts.fulfilled, refreshFromCatalog)
      .addCase(fetchHampers.fulfilled, refreshFromCatalog)
      .addCase(logoutThunk.fulfilled, resetOnLogout)
      .addCase(logoutThunk.rejected, resetOnLogout)
  },
})

export const { addLocal, updateLocal, removeLocal, addBox, removeBox, setCoupon, clearCoupon, clearCart } = cartSlice.actions
export const selectCart = (state) => state.cart
export const selectCoupon = (state) => state.cart.coupon
export const selectCartCount = (state) =>
  state.cart.items.reduce((s, i) => s + i.qty, 0) + state.cart.boxes.length
export const selectCartTotal = (state) => {
  const subtotal =
    state.cart.items.reduce((s, i) => s + i.product.price * i.qty, 0) +
    state.cart.boxes.reduce((s, b) => s + Number(b.totalPrice || 0), 0)
  // Mirror CheckoutModal's discount math (round to paise, HALF_UP) so the cart
  // drawer and checkout always show the same total when a coupon is applied.
  const coupon = state.cart.coupon
  const discount = coupon
    ? Math.round(subtotal * coupon.discountPercent) / 100
    : 0
  // Delivery fee on the discounted merchandise total — same rule as the
  // backend's OrderService, which computes the amount actually charged.
  const discounted = Math.max(0, subtotal - discount)
  return discounted + deliveryFeeFor(discounted)
}
export default cartSlice.reducer
