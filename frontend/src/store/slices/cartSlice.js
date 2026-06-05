import { createSlice } from '@reduxjs/toolkit'

const localKey = 'pc_cart'
const boxesKey = 'pc_cart_boxes'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (items) => { try { localStorage.setItem(localKey, JSON.stringify(items)) } catch {} }
const loadBoxes = () => { try { return JSON.parse(localStorage.getItem(boxesKey) || '[]') } catch { return [] } }
const saveBoxes = (boxes) => { try { localStorage.setItem(boxesKey, JSON.stringify(boxes)) } catch {} }

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadLocal(),
    // Gift boxes are persisted server-side (status IN_CART). We keep the returned
    // GiftBoxDto here purely so the cart drawer & checkout can display/total them.
    boxes: loadBoxes(),
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
    },
    removeLocal(state, action) {
      const productId = action.payload
      state.items = state.items.filter((i) => i.product.id !== productId)
      saveLocal(state.items)
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
    },
    clearCart(state) {
      state.items = []
      state.boxes = []
      saveLocal([])
      saveBoxes([])
    },
  },
})

export const { addLocal, updateLocal, removeLocal, addBox, removeBox, clearCart } = cartSlice.actions
export const selectCart = (state) => state.cart
export const selectCartItems = (state) => state.cart.items
export const selectCartBoxes = (state) => state.cart.boxes
export const selectCartCount = (state) =>
  state.cart.items.reduce((s, i) => s + i.qty, 0) + state.cart.boxes.length
export const selectCartTotal = (state) =>
  state.cart.items.reduce((s, i) => s + i.product.price * i.qty, 0) +
  state.cart.boxes.reduce((s, b) => s + Number(b.totalPrice || 0), 0)
export default cartSlice.reducer
