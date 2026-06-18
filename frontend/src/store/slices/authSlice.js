import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../api/services'
import { setToken, clearToken } from '../../api/tokenStore'
import { analytics, identify, reset } from '../../analytics'

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  // Tell the backend to clear its HttpOnly cookie; ignore errors (cookie cleared either way)
  try { await authApi.logout() } catch { /* no-op: cookie cleared either way */ }
  clearToken()
})

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await authApi.login(email, password)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async ({ name, email, password }, { rejectWithValue }) => {
  try {
    const { data } = await authApi.register(name, email, password)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const googleLogin = createAsyncThunk('auth/google', async (credential, { rejectWithValue }) => {
  try {
    const { data } = await authApi.googleLogin(credential)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google login failed')
  }
})

export const otpLogin = createAsyncThunk('auth/otp', async ({ accessToken, phone }, { rejectWithValue }) => {
  try {
    const { data } = await authApi.otpVerify(accessToken, phone)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Phone login failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.me()
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    // Always false on startup — fetchMe must resolve before route guards act
    authChecked: false,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      clearToken()
    },
    clearError(state) {
      state.error = null
    },
    setUser(state, action) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null }
    const rejected = (state, action) => { state.loading = false; state.error = action.payload }
    const fulfilled = (state, action) => {
      state.loading = false
      state.token = action.payload.token ?? null
      state.user = action.payload.user ?? null
      if (action.payload.token) setToken(action.payload.token)
    }

    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.token = null
        analytics.logout(); reset()
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.user = null
        state.token = null
        analytics.logout(); reset()
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, action) => {
        fulfilled(state, action); state.authChecked = true
        if (action.payload.user) { analytics.login('email'); identify(action.payload.user.id, { email: action.payload.user.email }) }
      })
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, action) => {
        fulfilled(state, action); state.authChecked = true
        if (action.payload.user) { analytics.signup('email'); identify(action.payload.user.id, { email: action.payload.user.email }) }
      })
      .addCase(register.rejected, rejected)
      .addCase(googleLogin.pending, pending)
      .addCase(googleLogin.fulfilled, (state, action) => {
        fulfilled(state, action); state.authChecked = true
        if (action.payload.user) { analytics.login('google'); identify(action.payload.user.id, { email: action.payload.user.email }) }
      })
      .addCase(googleLogin.rejected, rejected)
      .addCase(otpLogin.pending, pending)
      .addCase(otpLogin.fulfilled, (state, action) => {
        fulfilled(state, action); state.authChecked = true
        if (action.payload.user) { analytics.login('phone'); identify(action.payload.user.id, { phone: action.payload.user.phone }) }
      })
      .addCase(otpLogin.rejected, rejected)
      .addCase(fetchMe.pending, pending)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.authChecked = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.authChecked = true
        clearToken()
      })
  },
})

export const { logout, clearError, setUser } = authSlice.actions
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
// Use user presence, not token — token is ephemeral (lost on refresh until backend sends cookie)
export const selectIsLoggedIn = (state) => !!state.auth.user
export const selectAuthChecked = (state) => state.auth.authChecked
export default authSlice.reducer
