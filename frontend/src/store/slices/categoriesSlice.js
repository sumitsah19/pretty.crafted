import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { categoriesApi } from '../../api/services'

// Categories are near-static and read from several places (admin Products &
// Categories views, the homepage footer). This slice fetches them once and
// shares the result, instead of each consumer re-fetching on mount.
export const fetchCategories = createAsyncThunk(
  'categories/fetch',
  async () => {
    const { data } = await categoriesApi.list()
    return Array.isArray(data) ? data : []
  },
  {
    // Skip if already loaded or a fetch is in flight — de-dupes concurrent/repeat calls.
    condition: (_arg, { getState }) => {
      const s = getState().categories
      return !s.loaded && !s.loading
    },
  },
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    loaded: false,
  },
  reducers: {
    // Let admin mutations keep the shared cache in sync without a refetch.
    setCategories(state, action) {
      state.items = action.payload
      state.loaded = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.loaded = true
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state) => { state.loading = false })
  },
})

export const { setCategories } = categoriesSlice.actions
export const selectCategories = (state) => state.categories.items
export const selectCategoriesLoaded = (state) => state.categories.loaded
export default categoriesSlice.reducer
