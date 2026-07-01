import { describe, it, expect } from 'vitest'
import cartReducer, { addLocal, updateLocal, removeLocal, clearCart, selectCartTotal } from '../store/slices/cartSlice'
import { logoutThunk } from '../store/slices/authSlice'

const product = (id, price = 100) => ({ id, name: `Product ${id}`, price, category: 'Test', emoji: '🎁' })

const empty = { items: [] }

describe('cartSlice', () => {
  describe('addLocal', () => {
    it('adds a new product', () => {
      const state = cartReducer(empty, addLocal(product(1)))
      expect(state.items).toHaveLength(1)
      expect(state.items[0].product.id).toBe(1)
      expect(state.items[0].qty).toBe(1)
    })

    it('increments qty for duplicate product', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, addLocal(product(1)))
      expect(state.items).toHaveLength(1)
      expect(state.items[0].qty).toBe(2)
    })

    it('adds different products separately', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, addLocal(product(2)))
      expect(state.items).toHaveLength(2)
    })
  })

  describe('updateLocal', () => {
    it('updates qty by product ID', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, updateLocal({ productId: 1, qty: 5 }))
      expect(state.items[0].qty).toBe(5)
    })

    it('removes item when qty <= 0', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, updateLocal({ productId: 1, qty: 0 }))
      expect(state.items).toHaveLength(0)
    })

    it('ignores unknown product ID', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, updateLocal({ productId: 99, qty: 5 }))
      expect(state.items[0].qty).toBe(1)
    })
  })

  describe('removeLocal', () => {
    it('removes by product ID', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, addLocal(product(2)))
      state = cartReducer(state, removeLocal(1))
      expect(state.items).toHaveLength(1)
      expect(state.items[0].product.id).toBe(2)
    })

    it('is safe when product not in cart', () => {
      const state = cartReducer(empty, removeLocal(99))
      expect(state.items).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('empties the cart', () => {
      let state = cartReducer(empty, addLocal(product(1)))
      state = cartReducer(state, addLocal(product(2)))
      state = cartReducer(state, clearCart())
      expect(state.items).toHaveLength(0)
    })
  })

  describe('selectCartTotal (delivery fee mirrors backend OrderService)', () => {
    const stateWith = (items, coupon = null) => ({ cart: { items, boxes: [], coupon } })

    it('adds the ₹79 fee below the ₹999 threshold', () => {
      const state = stateWith([{ product: product(1, 500), qty: 1 }])
      expect(selectCartTotal(state)).toBe(579)
    })

    it('ships free at the threshold', () => {
      const state = stateWith([{ product: product(1, 999), qty: 1 }])
      expect(selectCartTotal(state)).toBe(999)
    })

    it('re-applies the fee when a coupon drops the total below the threshold', () => {
      // 1000 − 10% = 900 discounted → below 999 → +79
      const state = stateWith([{ product: product(1, 1000), qty: 1 }], { code: 'X', discountPercent: 10 })
      expect(selectCartTotal(state)).toBe(979)
    })

    it('charges nothing for an empty cart', () => {
      expect(selectCartTotal(stateWith([]))).toBe(0)
    })
  })

  describe('logout', () => {
    it('clears items, boxes and coupon so the next user of the device inherits nothing', () => {
      const populated = {
        items: [{ product: product(1), qty: 2 }],
        boxes: [{ id: 7, totalPrice: 500 }],
        coupon: { code: 'FESTIVE10', discountPercent: 10 },
      }
      const state = cartReducer(populated, { type: logoutThunk.fulfilled.type })
      expect(state.items).toHaveLength(0)
      expect(state.boxes).toHaveLength(0)
      expect(state.coupon).toBeNull()
    })
  })
})
