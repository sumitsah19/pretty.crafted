const TC = '#C4704A'
const DARK = '#2C1A0E'

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px', fontFamily: "'DM Sans', sans-serif", color: DARK, lineHeight: 1.8 }}>
      <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>Privacy Policy</h1>
      <p style={{ color: '#9C7A63', marginBottom: 48, fontSize: 14 }}>Last updated: May 2026</p>

      <Section title="1. Information We Collect">
        <p>We collect information you provide directly: name, email address, shipping address, and payment details when you place an order. We also collect usage data (pages visited, products viewed) to improve your experience.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul>
          <li>To fulfil and ship your orders</li>
          <li>To send order confirmations and shipping updates</li>
          <li>To send promotional emails (only with your consent, and you can unsubscribe any time)</li>
          <li>To improve our store and personalise your experience</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>We do not sell your personal data. We share it only with:</p>
        <ul>
          <li><b>Payment processors</b> (Razorpay) to complete transactions</li>
          <li><b>Shipping partners</b> to deliver your orders</li>
          <li><b>Analytics services</b> (PostHog) — anonymised usage data only</li>
          <li><b>Error monitoring</b> (Sentry) — no personally identifiable data</li>
        </ul>
      </Section>

      <Section title="4. Cookies">
        <p>We use an authentication cookie (<code>pc_token</code>) that is strictly necessary for you to stay logged in. We do not use tracking cookies without your consent. Analytics data is collected server-side where possible.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Order records are retained for 7 years for legal and accounting purposes. Account data is deleted within 30 days of an account deletion request. Anonymised analytics data may be retained indefinitely.</p>
      </Section>

      <Section title="6. Your Rights (GDPR)">
        <p>If you are in the European Economic Area, you have the right to access, correct, or delete your personal data. To exercise any of these rights, email us at <a href="mailto:privacy@prettycrafted.in" style={{ color: TC }}>privacy@prettycrafted.in</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="7. Data Security">
        <p>All data is transmitted over HTTPS. Passwords are hashed using BCrypt. Payment details are handled exclusively by Razorpay and never stored on our servers.</p>
      </Section>

      <Section title="8. Contact">
        <p>Questions about this policy? Contact us at <a href="mailto:privacy@prettycrafted.in" style={{ color: TC }}>privacy@prettycrafted.in</a>.</p>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 12, color: DARK }}>{title}</h2>
      <div style={{ fontSize: 15, color: '#3D2510' }}>{children}</div>
    </div>
  )
}
