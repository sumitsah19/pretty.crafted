import { describe, it, expect, beforeEach } from 'vitest'
import cartReducer, { addLocal, updateLocal, removeLocal, clearCart } from '../store/slices/cartSlice'

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
})
