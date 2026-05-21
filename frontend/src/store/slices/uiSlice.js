import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    showLogin: false,
    showSearch: false,
    showBoxBuilder: false,
    showOccasions: false,
    showCheckout: false,
    activeProduct: null,
    activeOccasion: null,
    personalizationProduct: null,
    showUserAccount: false,
    cartOpen: false,
    wishlistOpen: false,
  },
  reducers: {
    openLogin: (state) => { state.showLogin = true },
    closeLogin: (state) => { state.showLogin = false },
    openSearch: (state) => { state.showSearch = true },
    closeSearch: (state) => { state.showSearch = false },
    openBoxBuilder: (state) => { state.showBoxBuilder = true },
    closeBoxBuilder: (state) => { state.showBoxBuilder = false },
    openOccasions: (state) => { state.showOccasions = true },
    closeOccasions: (state) => { state.showOccasions = false },
    openCheckout: (state) => { state.showCheckout = true },
    closeCheckout: (state) => { state.showCheckout = false },
    setActiveProduct: (state, action) => { state.activeProduct = action.payload },
    clearActiveProduct: (state) => { state.activeProduct = null },
    setActiveOccasion: (state, action) => { state.activeOccasion = action.payload; state.showOccasions = false },
    clearActiveOccasion: (state) => { state.activeOccasion = null },
    setPersonalizationProduct: (state, action) => { state.personalizationProduct = action.payload },
    clearPersonalizationProduct: (state) => { state.personalizationProduct = null },
    openUserAccount: (state) => { state.showUserAccount = true },
    closeUserAccount: (state) => { state.showUserAccount = false },
    openCart: (state) => { state.cartOpen = true },
    closeCart: (state) => { state.cartOpen = false },
    openWishlist: (state) => { state.wishlistOpen = true },
    closeWishlist: (state) => { state.wishlistOpen = false },
  },
})

export const {
  openLogin, closeLogin,
  openSearch, closeSearch,
  openBoxBuilder, closeBoxBuilder,
  openOccasions, closeOccasions,
  openCheckout, closeCheckout,
  setActiveProduct, clearActiveProduct,
  setActiveOccasion, clearActiveOccasion,
  setPersonalizationProduct, clearPersonalizationProduct,
  openUserAccount, closeUserAccount,
  openCart, closeCart,
  openWishlist, closeWishlist,
} = uiSlice.actions

export const selectUI = (state) => state.ui
export const selectCartOpen = (state) => state.ui.cartOpen
export const selectWishlistOpen = (state) => state.ui.wishlistOpen
export default uiSlice.reducer
