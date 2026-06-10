import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productsApi } from '../../api/services'

const DEMO_PRODUCTS = [
  { id:1,  name:"Wildflower Soy Candle",      category:"Candles & Scents",   price:28, recipient:"her",  emoji:"🕯️", bg:"#E8D5C4", tag:"Bestseller", handcrafted:true,  rating:4.9, ratingCount:247, stock:47, description:"Hand-poured with wildflower botanical extracts and a clean cotton wick." },
  { id:2,  name:"Pressed Botanicals Ring",     category:"Handmade Jewelry",   price:42, recipient:"her",  emoji:"💍", bg:"#D5E0CC", tag:"New",        handcrafted:true,  rating:4.8, ratingCount:183, stock:12, description:"Preserved real botanicals set in clear resin on a sterling-silver band." },
  { id:3,  name:"Stoneware Coffee Mug",        category:"Ceramics",           price:28, recipient:"him",  emoji:"☕", bg:"#D4C5B5", tag:"Bestseller", handcrafted:true,  rating:4.7, ratingCount:312, stock:34, description:"Wheel-thrown stoneware with a warm glaze and generous 350ml capacity." },
  { id:4,  name:"Linen Watercolor Print",      category:"Art Prints",         price:48, recipient:"her",  emoji:"🖼️", bg:"#E0D5C5", tag:"",          handcrafted:true,  rating:4.6, ratingCount:89,  stock:8,  description:"Original watercolor reproduced on 300gsm cotton-linen paper." },
  { id:5,  name:"Rose Clay Face Mask Set",     category:"Skincare",           price:22, recipient:"her",  emoji:"🌹", bg:"#E8D0C8", tag:"New",        handcrafted:true,  rating:4.8, ratingCount:205, stock:56, description:"Three masks with rose clay, kaolin and chamomile for sensitive skin." },
  { id:6,  name:"Leather-bound Journal",       category:"Books & Stationery", price:38, recipient:"him",  emoji:"📔", bg:"#C8B89A", tag:"",          handcrafted:true,  rating:4.7, ratingCount:156, stock:21, description:"Full-grain leather cover with 200 pages of 120gsm cream dot-grid paper." },
  { id:7,  name:"Wildberry Jam Set",           category:"Food & Gourmet",     price:32, recipient:"kids", emoji:"🫙", bg:"#D4C0D0", tag:"Bestseller", handcrafted:false, rating:4.9, ratingCount:134, stock:39, description:"Three artisan jams: blackberry, raspberry, and wild blueberry preserve." },
  { id:8,  name:"Mini Terrarium Kit",          category:"Plants",             price:45, recipient:"kids", emoji:"🌱", bg:"#C8D8C0", tag:"New",        handcrafted:false, rating:4.6, ratingCount:78,  stock:15, description:"Everything you need to build a tiny ecosystem: pebbles, moss, soil, succulents." },
  { id:9,  name:"Cedar Beard Oil",             category:"Skincare",           price:26, recipient:"him",  emoji:"🌲", bg:"#C4D0C0", tag:"",          handcrafted:true,  rating:4.7, ratingCount:93,  stock:28, description:"Jojoba, argan and cedar essential oil blend for a soft, healthy beard." },
  { id:10, name:"Gold Vermeil Ear Cuff",       category:"Handmade Jewelry",   price:34, recipient:"her",  emoji:"✨", bg:"#E4D8B0", tag:"",          handcrafted:true,  rating:4.9, ratingCount:201, stock:19, description:"18k gold-plated 925 silver ear cuff — no piercing needed." },
  { id:11, name:"Spiced Honey Gift Set",       category:"Food & Gourmet",     price:38, recipient:"him",  emoji:"🍯", bg:"#E0C890", tag:"Bestseller", handcrafted:false, rating:4.8, ratingCount:167, stock:42, description:"Three raw honeys infused with cardamom, chili, and lemon thyme." },
  { id:12, name:"Fairy Light Terrarium",       category:"Plants",             price:52, recipient:"kids", emoji:"🏮", bg:"#C0D4D0", tag:"",          handcrafted:true,  rating:4.7, ratingCount:62,  stock:11, description:"Glass globe with moss, pebbles, and warm micro LED fairy lights." },
]

// Fallback hampers, used when the backend has none seeded yet (mirrors the
// "Hampers" category seeded in DataSeeder).
const DEMO_HAMPERS = [
  { id:13, name:"Radiant Morning Hamper", category:"Hampers", price:1499, recipient:"her", emoji:"🧺", bg:"#EDD5C0", tag:"Bestseller", rating:4.5, ratingCount:76,  stock:30, description:"Soy candle, rose clay mask, linen print & more." },
  { id:14, name:"Artisan Coffee Ritual",  category:"Hampers", price:1199, recipient:"him", emoji:"☕", bg:"#D4C5B5", tag:"New",        rating:5,   ratingCount:93,  stock:30, description:"Specialty brew, stoneware mug, spiced honey & journal." },
  { id:15, name:"Garden & Bloom Box",     category:"Hampers", price:1349, recipient:"all", emoji:"🌿", bg:"#C8D8C0", tag:"Bestseller", rating:5,   ratingCount:110, stock:30, description:"Terrarium kit, botanicals ring, wildflower candle." },
  { id:16, name:"Golden Hour Luxe Set",   category:"Hampers", price:1899, recipient:"her", emoji:"✨", bg:"#E4D8B0", tag:"",          rating:4.5, ratingCount:27,  stock:30, description:"Gold ear cuff, watercolor print, leather journal." },
]

// Maps backend ProductDto fields to the shape the UI components expect.
// Backend uses `categoryName`; UI uses `category`.
// Backend `price` is BigDecimal → comes as a number in JSON, kept as-is.
const normalize = (p) => ({
  ...p,
  category: p.categoryName ?? p.category ?? '',
  price: Number(p.price),
})

export const fetchProducts = createAsyncThunk('products/fetch', async (params) => {
  try {
    const { data } = await productsApi.list(params)
    const raw = Array.isArray(data) ? data : data.content || []
    if (!raw.length) return DEMO_PRODUCTS
    return raw.map(normalize)
  } catch {
    return DEMO_PRODUCTS
  }
})

export const fetchPopular = createAsyncThunk('products/popular', async () => {
  try {
    const { data } = await productsApi.popular()
    const raw = Array.isArray(data) ? data : []
    if (!raw.length) return DEMO_PRODUCTS.filter((p) => p.tag === 'Bestseller')
    return raw.map(normalize)
  } catch {
    return DEMO_PRODUCTS.filter((p) => p.tag === 'Bestseller')
  }
})

export const fetchHampers = createAsyncThunk('products/hampers', async () => {
  try {
    const { data } = await productsApi.hampers()
    const raw = Array.isArray(data) ? data : []
    if (!raw.length) return DEMO_HAMPERS
    return raw.map(normalize)
  } catch {
    return DEMO_HAMPERS
  }
})

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: DEMO_PRODUCTS,
    popular: DEMO_PRODUCTS.filter((p) => p.tag === 'Bestseller'),
    hampers: DEMO_HAMPERS,
    loading: false,
    isDemo: true,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.isDemo = action.payload === DEMO_PRODUCTS
      })
      .addCase(fetchProducts.rejected, (state) => { state.loading = false })
      .addCase(fetchPopular.fulfilled, (state, action) => {
        state.popular = action.payload
      })
      .addCase(fetchHampers.fulfilled, (state, action) => {
        state.hampers = action.payload
      })
  },
})

export const selectProducts = (state) => state.products.items
export const selectPopular = (state) => state.products.popular
export const selectHampers = (state) => state.products.hampers
export const selectProductsLoading = (state) => state.products.loading
export default productsSlice.reducer
