import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Prettycrafted'
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://prettycrafted.com'
const DEFAULT_IMAGE = `${SITE_URL}/logo.svg`
const DEFAULT_DESCRIPTION =
  'Prettycrafted offers handcrafted personalized gift boxes for birthdays, anniversaries, and special occasions. Shop unique gifts made with love by independent artisans.'
const DEFAULT_KEYWORDS =
  'Prettycrafted, handcrafted gifts, personalized gift boxes, artisan gifts, birthday gifts India, anniversary gifts, custom gift hampers, prettycrafted gifts'

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = '/',
  keywords = DEFAULT_KEYWORDS,
  type = 'website',
  noIndex = false,
  structuredData,
  product,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Crafted with love`
  const canonicalUrl = `${SITE_URL}${url}`

  // Build product schema if product prop is passed
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || DEFAULT_DESCRIPTION,
        image: product.imageUrl || DEFAULT_IMAGE,
        brand: { '@type': 'Brand', name: SITE_NAME },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'INR',
          // Reflect real stock — advertising sold-out items as InStock is a
          // rich-result policy violation. Unknown stock is assumed available.
          availability: Number(product.stock) <= 0
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: SITE_NAME },
        },
        ...(product.categories?.[0] && { category: product.categories[0] }),
      }
    : null

  const finalStructuredData = structuredData || productSchema

  return (
    <Helmet>
      {/* ── Primary ────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex
        ? <meta name="robots" content="noindex, nofollow" />
        : <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      }

      {/* ── Open Graph (Facebook, WhatsApp, LinkedIn) ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1080" />
      <meta property="og:image:height" content="1080" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="en_IN" />

      {/* ── Twitter Card ───────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* ── Structured Data (JSON-LD) ──────────────────── */}
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
    </Helmet>
  )
}
