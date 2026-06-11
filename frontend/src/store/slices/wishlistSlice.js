import { createSlice } from '@reduxjs/toolkit'

const localKey = 'pc_wishlist'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (ids) => { try { localStorage.setItem(localKey, JSON.stringify(ids)) } catch { /* storage unavailable — wishlist stays in-memory */ } }

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    ids: loadLocal(),
  },
  reducers: {
    toggleWishlist(state, action) {
      const id = action.payload
      const idx = state.ids.indexOf(id)
      if (idx >= 0) state.ids.splice(idx, 1)
      else state.ids.push(id)
      saveLocal(state.ids)
    },
  },
})

export const { toggleWishlist } = wishlistSlice.actions
export const selectWishlistIds = (state) => state.wishlist.ids

// Wishlist storage key for a product. Demo-catalog items are namespaced so a saved
// demo id can never be confused with a real backend product that shares the number.
export const wishlistKey = (p) => (p.demo ? `demo-${p.id}` : p.id)

export default wishlistSlice.reducer
