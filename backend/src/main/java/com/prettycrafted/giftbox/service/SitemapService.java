package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.repository.OccasionRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates the storefront sitemap.xml from live data, replacing the old
 * hand-maintained static file in frontend/public — which inevitably drifted
 * out of sync as occasions rotate seasonally (Mother's Day → Diwali → …) and
 * products come and go. Served at /api/public/sitemap.xml and exposed on the
 * storefront domain via a Vercel rewrite of /sitemap.xml (see frontend
 * vercel.json); robots.txt keeps pointing at https://prettycrafted.com/sitemap.xml.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SitemapService {

    private final OccasionRepository occasionRepo;
    private final ProductRepository productRepo;

    /** Storefront origin the URLs are built on (FRONTEND_URL in prod). */
    @Value("${app.frontend.url}")
    private String frontendUrl;

    // Static storefront routes — keep in sync with frontend/src/App.jsx.
    // Product pages and occasion pages are appended from the DB below.
    private static final List<String> POLICY_PATHS = List.of(
            "/privacy",
            "/terms",
            "/return-refund-policy",
            "/shipping-delivery-policy",
            "/cancellation-policy",
            "/cookie-policy",
            "/payment-terms",
            "/contact-support");

    public String generateXml() {
        String base = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;

        StringBuilder xml = new StringBuilder(8 * 1024);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"")
           .append(" xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\">\n");

        // Core landing pages
        url(xml, base, "/", "daily", "1.0");
        url(xml, base, "/shop", "daily", "0.9");
        url(xml, base, "/gift-boxes", "weekly", "0.9");
        url(xml, base, "/occasions", "weekly", "0.8");

        // Occasion landing pages — exactly the ones the storefront shows
        // (Admin → Occasions, visible only), so seasonal rotation is picked
        // up automatically instead of listing stale/hidden slugs.
        occasionRepo.findByVisibleTrueOrderByDisplayOrderAscIdAsc()
                .forEach(o -> url(xml, base, "/occasions/" + escape(o.getSlug()), "weekly", "0.7"));

        // Product pages — the whole catalog is public. Each entry carries its
        // main Cloudinary image (Google image-sitemap extension) so products
        // surface in Google Images too — a real discovery channel for gifting.
        for (Object[] row : productRepo.findAllIdsAndImageUrls()) {
            Long id = (Long) row[0];
            String image = (String) row[1];
            productUrl(xml, base, id, image);
        }

        // Legal / policy pages
        POLICY_PATHS.forEach(p -> url(xml, base, p, "yearly", "0.3"));

        xml.append("</urlset>\n");
        return xml.toString();
    }

    private static void url(StringBuilder xml, String base, String path,
                            String changefreq, String priority) {
        xml.append("  <url><loc>").append(base).append(path).append("</loc>")
           .append("<changefreq>").append(changefreq).append("</changefreq>")
           .append("<priority>").append(priority).append("</priority></url>\n");
    }

    private static void productUrl(StringBuilder xml, String base, Long id, String imageUrl) {
        xml.append("  <url><loc>").append(base).append("/products/").append(id).append("</loc>");
        if (imageUrl != null && !imageUrl.isBlank()) {
            xml.append("<image:image><image:loc>").append(escape(imageUrl))
               .append("</image:loc></image:image>");
        }
        xml.append("<changefreq>weekly</changefreq>")
           .append("<priority>0.6</priority></url>\n");
    }

    /** Slugs are admin-entered — escape XML special characters just in case. */
    private static String escape(String s) {
        return s == null ? "" : s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
