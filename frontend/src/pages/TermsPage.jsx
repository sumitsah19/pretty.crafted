const TC = '#C4704A'
const DARK = '#2C1A0E'

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px', fontFamily: "'DM Sans', sans-serif", color: DARK, lineHeight: 1.8 }}>
      <div style={{ fontSize: 11, color: TC, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Legal</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>Terms of Service</h1>
      <p style={{ color: '#9C7A63', marginBottom: 48, fontSize: 14 }}>Last updated: May 2026</p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using Pretty.Crafted, you agree to be bound by these Terms. If you do not agree, please do not use our service.</p>
      </Section>

      <Section title="2. Products and Orders">
        <ul>
          <li>All prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.</li>
          <li>Product availability is not guaranteed. We reserve the right to cancel orders for out-of-stock items and issue a full refund.</li>
          <li>Customised or personalised items cannot be returned unless faulty.</li>
        </ul>
      </Section>

      <Section title="3. Payments">
        <p>Payments are processed securely by Razorpay. We do not store your card details. By placing an order you authorise us to charge the amount shown at checkout.</p>
      </Section>

      <Section title="4. Shipping & Delivery">
        <p>Delivery times shown at checkout are estimates and may vary. We are not liable for delays caused by shipping partners or customs.</p>
      </Section>

      <Section title="5. Returns & Refunds">
        <p>You may return most items within 14 days of delivery for a full refund, provided they are unused and in original packaging. To initiate a return, email <a href="mailto:support@prettycrafted.in" style={{ color: TC }}>support@prettycrafted.in</a>.</p>
      </Section>

      <Section title="6. Intellectual Property">
        <p>All content on Pretty.Crafted — product images, copy, design, and branding — is owned by Pretty.Crafted or its licensors. You may not reproduce or redistribute any content without written permission.</p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>To the maximum extent permitted by law, Pretty.Crafted is not liable for any indirect, incidental, or consequential damages arising from your use of our service.</p>
      </Section>

      <Section title="8. Governing Law">
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, India.</p>
      </Section>

      <Section title="9. Changes to Terms">
        <p>We may update these Terms at any time. Continued use of our service after changes constitutes acceptance of the new Terms.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions? Email us at <a href="mailto:support@prettycrafted.in" style={{ color: TC }}>support@prettycrafted.in</a>.</p>
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
