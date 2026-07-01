import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import CookiePreferencesPanel from '../components/CookiePreferencesPanel'
import { policyApi } from '../api/services'
import { parsePolicyContent, renderPolicyBlocks } from '../utils/policyContent'

const TC = '#C4704A'
const DARK = '#2C1A0E'

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Generic legal/policy page — fetches its content from the admin-managed
// Policy CMS (/api/public/policies/{slug}) so every policy (Terms, Privacy,
// Return & Refund, Shipping, Cancellation, Cookie, Payment, Contact) shares
// one component and can be edited without a code change.
export default function PolicyPage({ slug: slugProp }) {
  const params = useParams()
  const slug = slugProp || params.slug
  // Keyed by slug so navigating between policy routes (or the /policies/:slug
  // catch-all) never renders stale content while the new fetch is in flight.
  const [result, setResult] = useState({ slug: null, policy: null, notFound: false })

  useEffect(() => {
    let alive = true
    policyApi.get(slug)
      .then(({ data }) => { if (alive) setResult({ slug, policy: data, notFound: false }) })
      .catch(() => { if (alive) setResult({ slug, policy: null, notFound: true }) })
    return () => { alive = false }
  }, [slug])

  const loading = result.slug !== slug
  const policy = loading ? null : result.policy
  const notFound = loading ? false : result.notFound

  if (notFound) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: DARK, marginBottom: 10 }}>Page not found</div>
        <p style={{ color: '#9C7A63', fontSize: 14 }}>This policy isn't available right now. Please check back later.</p>
      </div>
    )
  }

  if (!policy) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px', textAlign: 'center', color: '#9C7A63' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EDE4D8', borderTopColor: TC, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
        Loading…
      </div>
    )
  }

  const blocks = parsePolicyContent(policy.content)

  return (
    <>
      <SEO
        title={policy.title}
        description={policy.shortDescription}
        url={`/${slug}`}
      />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px', fontFamily: "'DM Sans', sans-serif", color: DARK, lineHeight: 1.8 }}>
        <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>{policy.title}</h1>
        <p style={{ color: '#9C7A63', marginBottom: 48, fontSize: 14 }}>
          {policy.effectiveDate && <>Effective {formatDate(policy.effectiveDate)}</>}
          {policy.effectiveDate && policy.lastUpdatedDate && ' · '}
          {policy.lastUpdatedDate && <>Last updated {formatDate(policy.lastUpdatedDate)}</>}
        </p>

        {renderPolicyBlocks(blocks)}

        {slug === 'cookie-policy' && <CookiePreferencesPanel />}
      </div>
    </>
  )
}
