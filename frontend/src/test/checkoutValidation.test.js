import { describe, it, expect } from 'vitest'

// Inline the validation function exactly as it appears in CheckoutModal
function isExpiryValid(expiry) {
  if (expiry.length !== 5) return false
  const [mm, yy] = expiry.split('/')
  const month = parseInt(mm, 10)
  const year = 2000 + parseInt(yy, 10)
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

describe('isExpiryValid', () => {
  const now = new Date()
  const currentYear = now.getFullYear() % 100  // last two digits
  const currentMonth = now.getMonth() + 1

  it('accepts a future month this year', () => {
    const future = currentMonth < 12 ? currentMonth + 1 : currentMonth
    expect(isExpiryValid(`${String(future).padStart(2,'0')}/${currentYear}`)).toBe(true)
  })

  it('accepts next year', () => {
    expect(isExpiryValid(`01/${currentYear + 1}`)).toBe(true)
  })

  it('rejects past year', () => {
    expect(isExpiryValid(`12/${currentYear - 1}`)).toBe(false)
  })

  it('rejects month 0', () => {
    expect(isExpiryValid(`00/${currentYear + 1}`)).toBe(false)
  })

  it('rejects month 13', () => {
    expect(isExpiryValid(`13/${currentYear + 1}`)).toBe(false)
  })

  it('rejects short input', () => {
    expect(isExpiryValid('12/2')).toBe(false)
    expect(isExpiryValid('')).toBe(false)
  })
})
