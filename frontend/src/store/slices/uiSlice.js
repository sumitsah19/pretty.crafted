import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    showLogin: false,
    showSearch: false,
    showBoxBuilder: false,
    showCheckout: false,
    activeProduct: null,
    activeOccasion: null,
    showUserAccount: false,
    // Which screen the account modal opens on: 'home' | 'orders' | 'wishlist' | 'addresses' | 'help' | 'profile'
    userAccountView: 'home',
    cartOpen: false,
    wishlistOpen: false,
    showHamperShop: false,
    showShop: false,
  },
  reducers: {
    openLogin: (state) => { state.showLogin = true },
    closeLogin: (state) => { state.showLogin = false },
    openSearch: (state) => { state.showSearch = true },
    closeSearch: (state) => { state.showSearch = false },
    openBoxBuilder: (state) => { state.showBoxBuilder = true },
    closeBoxBuilder: (state) => { state.showBoxBuilder = false },
    openCheckout: (state) => { state.showCheckout = true },
    closeCheckout: (state) => { state.showCheckout = false },
    setActiveProduct: (state, action) => { state.activeProduct = action.payload },
    clearActiveProduct: (state) => { state.activeProduct = null },
    setActiveOccasion: (state, action) => { state.activeOccasion = action.payload },
    clearActiveOccasion: (state) => { state.activeOccasion = null },
    // Optional payload: the screen to open on, e.g. openUserAccount('orders')
    openUserAccount: (state, action) => { state.showUserAccount = true; state.userAccountView = action.payload || 'home' },
    closeUserAccount: (state) => { state.showUserAccount = false; state.userAccountView = 'home' },
    openCart: (state) => { state.cartOpen = true },
    closeCart: (state) => { state.cartOpen = false },
    openWishlist: (state) => { state.wishlistOpen = true },
    closeWishlist: (state) => { state.wishlistOpen = false },
    openHamperShop: (state) => { state.showHamperShop = true },
    closeHamperShop: (state) => { state.showHamperShop = false },
    openShop: (state) => { state.showShop = true },
    closeShop: (state) => { state.showShop = false },
  },
})

export const {
  openLogin, closeLogin,
  openSearch, closeSearch,
  openBoxBuilder, closeBoxBuilder,
  openCheckout, closeCheckout,
  setActiveProduct, clearActiveProduct,
  setActiveOccasion, clearActiveOccasion,
  openUserAccount, closeUserAccount,
  openCart, closeCart,
  openWishlist, closeWishlist,
  openHamperShop, closeHamperShop,
  openShop, closeShop,
} = uiSlice.actions

export const selectUI = (state) => state.ui
export const selectCartOpen = (state) => state.ui.cartOpen
export const selectWishlistOpen = (state) => state.ui.wishlistOpen
export const selectUserAccountView = (state) => state.ui.userAccountView
export default uiSlice.reducer
