import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { productsApi } from '../../api/services'

// A product can belong to more than one category and target more than one
// recipient — `categories`/`recipients` are always arrays. An empty
// `recipients` array means "not targeted, shows for everyone" (the old "all").
const DEMO_PRODUCTS = [
  { id:1,  name:"Wildflower Soy Candle",      categories:["Candles & Scents"],   price:28, originalPrice:35, recipients:["her"],  emoji:"🕯️", bg:"#E8D5C4", tag:"Bestseller", handcrafted:true,  rating:4.9, ratingCount:247, stock:47, description:"Hand-poured with wildflower botanical extracts and a clean cotton wick." },
  { id:2,  name:"Pressed Botanicals Ring",     categories:["Handmade Jewelry"],   price:42, originalPrice:52, recipients:["her"],  emoji:"💍", bg:"#D5E0CC", tag:"New",        handcrafted:true,  rating:4.8, ratingCount:183, stock:12, description:"Preserved real botanicals set in clear resin on a sterling-silver band." },
  { id:3,  name:"Stoneware Coffee Mug",        categories:["Ceramics"],           price:28, originalPrice:34, recipients:["him"],  emoji:"☕", bg:"#D4C5B5", tag:"Bestseller", handcrafted:true,  rating:4.7, ratingCount:312, stock:34, description:"Wheel-thrown stoneware with a warm glaze and generous 350ml capacity." },
  { id:4,  name:"Linen Watercolor Print",      categories:["Art Prints"],         price:48, originalPrice:60, recipients:["her"],  emoji:"🖼️", bg:"#E0D5C5", tag:"",          handcrafted:true,  rating:4.6, ratingCount:89,  stock:8,  description:"Original watercolor reproduced on 300gsm cotton-linen paper." },
  { id:5,  name:"Rose Clay Face Mask Set",     categories:["Skincare"],           price:22, originalPrice:29, recipients:["her"],  emoji:"🌹", bg:"#E8D0C8", tag:"New",        handcrafted:true,  rating:4.8, ratingCount:205, stock:56, description:"Three masks with rose clay, kaolin and chamomile for sensitive skin." },
  { id:6,  name:"Leather-bound Journal",       categories:["Books & Stationery"], price:38, originalPrice:45, recipients:["him"],  emoji:"📔", bg:"#C8B89A", tag:"",          handcrafted:true,  rating:4.7, ratingCount:156, stock:21, description:"Full-grain leather cover with 200 pages of 120gsm cream dot-grid paper." },
  { id:7,  name:"Wildberry Jam Set",           categories:["Food & Gourmet"],     price:32, originalPrice:40, recipients:["kids"], emoji:"🫙", bg:"#D4C0D0", tag:"Bestseller", handcrafted:false, rating:4.9, ratingCount:134, stock:39, description:"Three artisan jams: blackberry, raspberry, and wild blueberry preserve." },
  { id:8,  name:"Mini Terrarium Kit",          categories:["Plants"],             price:45, originalPrice:56, recipients:["kids"], emoji:"🌱", bg:"#C8D8C0", tag:"New",        handcrafted:false, rating:4.6, ratingCount:78,  stock:15, description:"Everything you need to build a tiny ecosystem: pebbles, moss, soil, succulents." },
  { id:9,  name:"Cedar Beard Oil",             categories:["Skincare"],           price:26, originalPrice:32, recipients:["him"],  emoji:"🌲", bg:"#C4D0C0", tag:"",          handcrafted:true,  rating:4.7, ratingCount:93,  stock:28, description:"Jojoba, argan and cedar essential oil blend for a soft, healthy beard." },
  { id:10, name:"Gold Vermeil Ear Cuff",       categories:["Handmade Jewelry"],   price:34, originalPrice:44, recipients:["her"],  emoji:"✨", bg:"#E4D8B0", tag:"",          handcrafted:true,  rating:4.9, ratingCount:201, stock:19, description:"18k gold-plated 925 silver ear cuff — no piercing needed." },
  { id:11, name:"Spiced Honey Gift Set",       categories:["Food & Gourmet"],     price:38, originalPrice:48, recipients:["him"],  emoji:"🍯", bg:"#E0C890", tag:"Bestseller", handcrafted:false, rating:4.8, ratingCount:167, stock:42, description:"Three raw honeys infused with cardamom, chili, and lemon thyme." },
  { id:12, name:"Fairy Light Terrarium",       categories:["Plants"],             price:52, originalPrice:65, recipients:["kids"], emoji:"🏮", bg:"#C0D4D0", tag:"",          handcrafted:true,  rating:4.7, ratingCount:62,  stock:11, description:"Glass globe with moss, pebbles, and warm micro LED fairy lights." },
  // `demo: true` marks items that don't exist in the backend, so checkout / the box
  // builder can refuse them instead of sending fake ids to the server.
].map((p) => ({ ...p, demo: true }))

// Fallback hampers, used when the backend has none seeded yet (mirrors the
// "Hampers" category seeded in DataSeeder).
const DEMO_HAMPERS = [
  { id:13, name:"Radiant Morning Hamper", categories:["Hampers"], price:1499, originalPrice:1899, recipients:["her"], emoji:"🧺", bg:"#EDD5C0", tag:"Bestseller", rating:4.5, ratingCount:76,  stock:30, description:"Soy candle, rose clay mask, linen print & more." },
  { id:14, name:"Artisan Coffee Ritual",  categories:["Hampers"], price:1199, originalPrice:1499, recipients:["him"], emoji:"☕", bg:"#D4C5B5", tag:"New",        rating:5,   ratingCount:93,  stock:30, description:"Specialty brew, stoneware mug, spiced honey & journal." },
  { id:15, name:"Garden & Bloom Box",     categories:["Hampers"], price:1349, originalPrice:1699, recipients:[],      emoji:"🌿", bg:"#C8D8C0", tag:"Bestseller", rating:5,   ratingCount:110, stock:30, description:"Terrarium kit, botanicals ring, wildflower candle." },
  { id:16, name:"Golden Hour Luxe Set",   categories:["Hampers"], price:1899, originalPrice:2499, recipients:["her"], emoji:"✨", bg:"#E4D8B0", tag:"",          rating:4.5, ratingCount:27,  stock:30, description:"Gold ear cuff, watercolor print, leather journal." },
].map((p) => ({ ...p, demo: true }))

// Maps backend ProductDto fields to the shape the UI components expect.
// Backend uses `categoryNames`; UI uses `categories`. `recipients` passes through
// as-is (already an array on both sides).
// Backend `price` is BigDecimal → comes as a number in JSON, kept as-is.
const normalize = (p) => ({
  ...p,
  categories: p.categoryNames ?? p.categories ?? [],
  recipients: p.recipients ?? [],
  price: Number(p.price),
  // MRP is optional; keep it null (not NaN) when absent so the card can hide the discount.
  originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
  // Rating/review count come from the backend now; keep null when unset so the card can fall back.
  rating: p.rating != null ? Number(p.rating) : null,
  reviewCount: p.reviewCount != null ? Number(p.reviewCount) : (p.ratingCount != null ? Number(p.ratingCount) : null),
})

// A request is "filtered" when the caller narrowed it (search/category). An empty
// result there means a genuine "no matches" and must be shown as-is — falling back
// to the demo catalog would fabricate products the user never searched for. The
// demo list is only a bootstrap for an unfiltered, not-yet-seeded backend (and an
// offline/error fallback so the store is never blank).
const isFiltered = (params) => !!(params && (params.q || params.categoryId))

// Walks every page of the paginated backend response so the storefront holds
// the whole catalog — a single size-capped request would silently hide any
// product past the cap. MAX_PAGES is a runaway guard, not an expected limit.
const PAGE_SIZE = 100
const MAX_PAGES = 10

export const fetchProducts = createAsyncThunk('products/fetch', async (params) => {
  try {
    let all = []
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data } = await productsApi.list({ ...params, size: PAGE_SIZE, page })
      const raw = Array.isArray(data) ? data : data.content || []
      all = all.concat(raw)
      const isLastPage = Array.isArray(data) ? true : (data.last ?? true)
      if (isLastPage) break
    }
    if (!all.length) return isFiltered(params) ? [] : DEMO_PRODUCTS
    return all.map(normalize)
  } catch {
    return DEMO_PRODUCTS
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
    hampers: DEMO_HAMPERS,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state) => { state.loading = false })
      .addCase(fetchHampers.fulfilled, (state, action) => {
        state.hampers = action.payload
      })
  },
})

export const selectProducts = (state) => state.products.items
export const selectHampers = (state) => state.products.hampers
export const selectProductsLoading = (state) => state.products.loading
export default productsSlice.reducer
