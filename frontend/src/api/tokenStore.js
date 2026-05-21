// In-memory token store — never touches localStorage/sessionStorage.
// Axios reads from here; authSlice writes to here.
// On page refresh this is empty; session is restored via HttpOnly cookie + fetchMe.
let _token = null
export const getToken = () => _token
export const setToken = (t) => { _token = t }
export const clearToken = () => { _token = null }
