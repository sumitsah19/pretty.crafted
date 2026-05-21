import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartApi } from '../../api/services'

const localKey = 'pc_cart'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(localKey) || '[]') } catch { return [] } }
const saveLocal = (items) => { try { localStorage.setItem(localKey, JSON.stringify(items)) } catch {} }

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.get()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load cart')
  }
})

export const addToCartApi = createAsyncThunk('cart/addApi', async ({ productId, qty = 1 }, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.add(productId, qty)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to add to cart')
  }
})

export const updateCartApi = createAsyncThunk('cart/updateApi', async ({ itemId, qty }, { rejectWithValue }) => {
  try {
    const { data } = await cartApi.update(itemId, qty)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update cart')
  }
})

export const removeCartApi = createAsyncThunk('cart/removeApi', async (itemId, { rejectWithValue }) => {
  try {
    await cartApi.remove(itemId)
    return itemId
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item')
  }
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadLocal(),
    serverItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    addLocal(state, action) {
      const product = action.payload
      const existing = state.items.findIndex((i) => i.product.id === product.id)
      if (existing >= 0) {
        state.items[existing].qty += 1
      } else {
        state.items.push({ product, qty: 1 })
      }
      saveLocal(state.items)
    },
    updateLocal(state, action) {
      const { idx, qty } = action.payload
      if (qty <= 0) state.items.splice(idx, 1)
      else state.items[idx].qty = qty
      saveLocal(state.items)
    },
    removeLocal(state, action) {
      state.items.splice(action.payload, 1)
      saveLocal(state.items)
    },
    clearCart(state) {
      state.items = []
      state.serverItems = []
      saveLocal([])
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => { state.loading = true })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.serverItems = action.payload.items || []
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { addLocal, updateLocal, removeLocal, clearCart } = cartSlice.actions
export const selectCart = (state) => state.cart
export const selectCartItems = (state) => state.cart.items
export const selectCartCount = (state) => state.cart.items.reduce((s, i) => s + i.qty, 0)
export const selectCartTotal = (state) => state.cart.items.reduce((s, i) => s + i.product.price * i.qty, 0)
export default cartSlice.reducer
