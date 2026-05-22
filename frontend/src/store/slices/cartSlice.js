import { createSlice } from '@reduxjs/toolkit'

const localKey = 'pc_cart'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (items) => { try { localStorage.setItem(localKey, JSON.stringify(items)) } catch {} }

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadLocal(),
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
    clearCart(state) {
      state.items = []
      saveLocal([])
    },
  },
})

export const { addLocal, updateLocal, removeLocal, clearCart } = cartSlice.actions
export const selectCart = (state) => state.cart
export const selectCartItems = (state) => state.cart.items
export const selectCartCount = (state) => state.cart.items.reduce((s, i) => s + i.qty, 0)
export const selectCartTotal = (state) => state.cart.items.reduce((s, i) => s + i.product.price * i.qty, 0)
export default cartSlice.reducer
