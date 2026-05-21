import { createSlice } from '@reduxjs/toolkit'

const localKey = 'pc_wishlist'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (ids) => { try { localStorage.setItem(localKey, JSON.stringify(ids)) } catch {} }

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
export default wishlistSlice.reducer
