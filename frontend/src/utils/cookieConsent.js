const STORAGE_KEY = 'pc_cookie_consent'

export const COOKIE_CATEGORIES = [
  { key: 'essential', label: 'Essential', locked: true,
    description: 'Required for core functionality — staying signed in and remembering your cart. Always on.' },
  { key: 'functional', label: 'Functional',
    description: 'Remembers preferences like recently viewed products and wishlist items for a smoother visit.' },
  { key: 'analytics', label: 'Analytics',
    description: 'Helps us understand how visitors use Prettycrafted so we can improve the site.' },
  { key: 'marketing', label: 'Marketing',
    description: 'Used to measure promotions and show more relevant offers.' },
]

const DEFAULTS = { essential: true, functional: false, analytics: false, marketing: false }

/** Returns saved preferences, or null if the user hasn't made a choice yet. */
export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...DEFAULTS, ...JSON.parse(raw), essential: true }
  } catch {
    return null
  }
}

export function saveCookieConsent(prefs) {
  const value = {
    essential: true,
    functional: !!prefs.functional,
    analytics: !!prefs.analytics,
    marketing: !!prefs.marketing,
    updatedAt: new Date().toISOString(),
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* storage unavailable */ }
  return value
}
