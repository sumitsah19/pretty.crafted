package com.prettycrafted.giftbox.seed;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Faq;
import com.prettycrafted.giftbox.domain.HeroCard;
import com.prettycrafted.giftbox.domain.HeroCardType;
import com.prettycrafted.giftbox.domain.Occasion;
import com.prettycrafted.giftbox.domain.Policy;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.FaqRepository;
import com.prettycrafted.giftbox.repository.HeroCardRepository;
import com.prettycrafted.giftbox.repository.OccasionRepository;
import com.prettycrafted.giftbox.repository.PolicyRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {
    private final CategoryRepository categoryRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final HeroCardRepository heroCardRepo;
    private final FaqRepository faqRepo;
    private final PolicyRepository policyRepo;
    private final OccasionRepository occasionRepo;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    // Optional: comma-separated list of emails to promote to ADMIN on startup.
    // e.g. SEED_ADMIN_EMAIL=sumit@gmail.com,gunja@gmail.com
    // Safe — runs server-side only, no HTTP endpoint exposed.
    @Value("${app.seed.admin-email:}")
    private String adminEmail;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        promoteAdminEmail();
        seedCatalog();
        seedHampers();
        backfillProductMetrics();
        seedHeroCards();
        seedFaqs();
        seedPolicies();
        seedOccasions();
        backfillFeaturedOccasion();
    }

    private void seedAdmin() {
        String fallbackEmail = "admin@prettycrafted.local";
        if (userRepo.existsByEmail(fallbackEmail)) return;
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("SEED_ADMIN_PASSWORD is not set — skipping admin seed. Set the env var and restart.");
            return;
        }
        userRepo.save(User.builder()
            .email(fallbackEmail)
            .passwordHash(passwordEncoder.encode(adminPassword))
            .name("Pretty Crafted Admin")
            .role(Role.ADMIN)
            .build());
        log.info("Seeded fallback admin user: {}", fallbackEmail);
    }

    /**
     * Promotes every email in SEED_ADMIN_EMAIL (comma-separated) to ADMIN on startup.
     * Idempotent — no-op if already ADMIN. Logs a warning if account not found yet.
     * e.g. SEED_ADMIN_EMAIL=sumit@gmail.com,gunja@gmail.com
     */
    private void promoteAdminEmail() {
        if (adminEmail == null || adminEmail.isBlank()) return;
        for (String raw : adminEmail.split(",")) {
            String email = raw.trim().toLowerCase();
            if (email.isBlank()) continue;
            userRepo.findByEmail(email).ifPresentOrElse(user -> {
                if (user.getRole() != Role.ADMIN) {
                    user.setRole(Role.ADMIN);
                    userRepo.save(user);
                    log.info("Promoted {} to ADMIN via SEED_ADMIN_EMAIL", email);
                }
            }, () -> log.warn("SEED_ADMIN_EMAIL: '{}' not found yet — sign in once, then redeploy", email));
        }
    }

    private void seedCatalog() {
        if (categoryRepo.count() > 0) return;
        log.info("Seeding categories and products...");

        Category jewellery = categoryRepo.save(Category.builder()
            .name("Jewellery").slug("jewellery")
            .description("Delicate pieces that sparkle softly.").build());
        Category wellness = categoryRepo.save(Category.builder()
            .name("Wellness").slug("wellness")
            .description("Self-care rituals for a gentle glow.").build());
        Category treats = categoryRepo.save(Category.builder()
            .name("Treats").slug("treats")
            .description("Sweet bites for every cozy moment.").build());
        Category keepsakes = categoryRepo.save(Category.builder()
            .name("Keepsakes").slug("keepsakes")
            .description("Little things that carry big memories.").build());
        Category accessories = categoryRepo.save(Category.builder()
            .name("Accessories").slug("accessories")
            .description("Finishing touches to everyday charm.").build());

        seed(jewellery, "Pearl Earrings", "Handcrafted pearl drop earrings.", "499.00", 40);
        seed(jewellery, "Charm Bracelet", "Rose gold plated with pink crystal charm.", "349.00", 60);
        seed(jewellery, "Gold Anklet", "Dainty chain, perfect for layering.", "299.00", 35);

        seed(wellness, "Rose Candle", "Soy wax, 40h burn time, rose petals.", "549.00", 25);
        seed(wellness, "Face Mask Set", "Three sheet masks for a dewy finish.", "199.00", 120);
        seed(wellness, "Skincare Kit", "Cleanser, toner, and serum mini set.", "749.00", 18);
        seed(wellness, "Herbal Tea", "Rose and hibiscus, 20 sachets.", "249.00", 80);

        seed(treats, "Pink Chocolate Box", "Assorted artisan chocolates, 12 pieces.", "399.00", 50);
        seed(treats, "Dry Fruit Box", "Almonds, cashews, cranberries, pistachios.", "299.00", 70);
        seed(treats, "Macarons", "Six rose-pink French macarons.", "349.00", 30);

        seed(keepsakes, "Photo Album", "Pink linen cover, 40 pages.", "649.00", 22);
        seed(keepsakes, "Gold-foil Journal", "Lined pages with gold trim.", "299.00", 90);

        seed(accessories, "Hair Bow Set", "Three silk bows, rose shades.", "299.00", 45);
        seed(accessories, "Silk Scrunchies", "Pack of five, assorted pinks.", "199.00", 150);
        seed(accessories, "Crystal Keychain", "Heart crystal on rose gold chain.", "249.00", 100);

        log.info("Seed complete: {} categories, {} products",
            categoryRepo.count(), productRepo.count());
    }

    private void seed(Category c, String name, String desc, String price, int stock) {
        Product p = Product.builder()
            .name(name)
            .description(desc)
            .price(new BigDecimal(price))
            .stock(stock)
            .category(c)
            .popularityScore(0)
            .build();
        applyMetrics(p);
        productRepo.save(p);
    }

    /**
     * Seeds the curated "Hampers" collection shown in the storefront's
     * "Hamper For You" / "Gift Hampers" sections. Idempotent and independent of
     * {@link #seedCatalog()} so it also back-fills databases seeded before
     * hampers existed.
     */
    private void seedHampers() {
        if (categoryRepo.existsByName("Hampers")) return;
        log.info("Seeding hampers...");

        Category hampers = categoryRepo.save(Category.builder()
            .name("Hampers").slug("hampers")
            .description("Curated gift hampers, ready to gift.").build());

        seedHamper(hampers, "Radiant Morning Hamper", "Soy candle, rose clay mask, linen print & more.", "1499.00", 30, "her", "Bestseller");
        seedHamper(hampers, "Artisan Coffee Ritual", "Specialty brew, stoneware mug, spiced honey & journal.", "1199.00", 30, "him", "New");
        seedHamper(hampers, "Garden & Bloom Box", "Terrarium kit, botanicals ring, wildflower candle.", "1349.00", 30, "all", "Bestseller");
        seedHamper(hampers, "Golden Hour Luxe Set", "Gold ear cuff, watercolor print, leather journal.", "1899.00", 30, "her", "");

        log.info("Seed complete: hampers category with {} products", productRepo.count());
    }

    private void seedHamper(Category c, String name, String desc, String price, int stock, String recipient, String tag) {
        Product p = Product.builder()
            .name(name)
            .description(desc)
            .price(new BigDecimal(price))
            .stock(stock)
            .category(c)
            .recipient(recipient)
            .tag(tag)
            .popularityScore(0)
            .build();
        applyMetrics(p);
        productRepo.save(p);
    }

    /**
     * Fills in the MRP snapshot for a product when it is unset. Only touches the
     * null field, so it's safe on both fresh seeds and existing rows and never
     * clobbers an admin-set value.
     *
     * <p>Rating and review count are deliberately NOT fabricated: showing made-up
     * stars/counts next to the real review system ({@code ReviewService}) is a
     * trust/legal risk and the two would contradict each other. Products start
     * with no rating and earn one from genuine reviews; the storefront hides
     * stars until then (see ProductCard).
     *
     * <ul>
     *   <li>MRP ≈ 25% above the selling price (so cards show a ~20% "Save" badge).</li>
     * </ul>
     */
    private void applyMetrics(Product p) {
        if (p.getOriginalPrice() == null && p.getPrice() != null) {
            p.setOriginalPrice(p.getPrice()
                .multiply(new BigDecimal("1.25"))
                .setScale(0, java.math.RoundingMode.HALF_UP));
        }
    }

    /**
     * Back-fills MRP on products seeded before the column existed, so the storefront
     * shows discounts without a manual edit. Only rows where MRP is still null are
     * treated as legacy — an admin-cleared value is left alone.
     */
    private void backfillProductMetrics() {
        List<Product> legacy = productRepo.findAll().stream()
            .filter(p -> p.getOriginalPrice() == null)
            .toList();
        if (!legacy.isEmpty()) {
            legacy.forEach(this::applyMetrics);
            productRepo.saveAll(legacy);
            log.info("Back-filled MRP on {} product(s)", legacy.size());
        }
    }

    /**
     * Seeds a handful of cards for the storefront hero CoverFlow so the carousel
     * renders real images out of the box. Idempotent — served read-only via the
     * public /api/public/hero-cards endpoint.
     */
    private void seedHeroCards() {
        if (heroCardRepo.count() > 0) return;
        log.info("Seeding hero cards...");

        seedHeroCard("https://res.cloudinary.com/demo/image/upload/v1/giftbox/hero/velvet-box.jpg",      "Velvet Box",     HeroCardType.PRODUCT, 0);
        seedHeroCard("https://res.cloudinary.com/demo/image/upload/v1/giftbox/hero/blossom-crate.jpg",    "Blossom Crate",  HeroCardType.HAMPER,  1);
        seedHeroCard("https://res.cloudinary.com/demo/image/upload/v1/giftbox/hero/golden-hour.jpg",      "Golden Hour",    HeroCardType.PRODUCT, 2);
        seedHeroCard("https://res.cloudinary.com/demo/image/upload/v1/giftbox/hero/petal-pine.jpg",       "Petal & Pine",   HeroCardType.HAMPER,  3);
        seedHeroCard("https://res.cloudinary.com/demo/image/upload/v1/giftbox/hero/copper-dream.jpg",     "Copper Dream",   HeroCardType.PRODUCT, 4);

        log.info("Seed complete: {} hero cards", heroCardRepo.count());
    }

    private void seedHeroCard(String imageUrl, String title, HeroCardType type, int order) {
        heroCardRepo.save(HeroCard.builder()
            .imageUrl(imageUrl)
            .title(title)
            .type(type)
            .displayOrder(order)
            .active(true)
            .build());
    }

    /**
     * Seeds the Help Center FAQ accordion. Idempotent — admins edit, add, reorder,
     * or hide these via the /api/admin/faqs endpoints (Admin → FAQs).
     */
    private void seedFaqs() {
        if (faqRepo.count() > 0) return;
        log.info("Seeding FAQs...");

        seedFaq("How do I track my Prettycrafted order?",
            "Open Account → My Orders to see every order and its live status (Placed, Processing, "
            + "Shipped, Delivered). Once an order ships, the tracking link appears on the order detail page.",
            "Orders", 0);
        seedFaq("Can I change or cancel my order after placing it?",
            "Orders can be cancelled from Account → My Orders while they are still Placed or Processing. "
            + "Once an order is Shipped it can no longer be cancelled — please use Returns & Exchanges instead. "
            + "Any applicable cancellation charge is shown before you confirm.",
            "Orders", 1);
        seedFaq("How do I return or exchange a gift item?",
            "Go to Help Center → Returns & Exchanges, pick the delivered order and item, choose Return or "
            + "Exchange, select a reason and (if asked) add photos, then submit. You can track the request "
            + "status — Pending, Approved, Rejected or Completed — from the same screen.",
            "Returns", 2);
        seedFaq("When will I receive my refund?",
            "Approved refunds are processed back to your original payment method within 5–7 business days. "
            + "You can follow the refund status under Help Center → Payments.",
            "Payments", 3);
        seedFaq("How do I apply a coupon or promo code?",
            "Enter your code in the cart or at checkout and tap Apply — the discount is reflected in your "
            + "total immediately. Active offers are listed under Help Center → Offers.",
            "Offers", 4);
        seedFaq("What payment methods are accepted?",
            "We accept UPI, all major credit and debit cards, and net banking through our secure Razorpay "
            + "checkout. Your card details are never stored on our servers.",
            "Payments", 5);

        log.info("Seed complete: {} FAQs", faqRepo.count());
    }

    private void seedFaq(String question, String answer, String category, int order) {
        faqRepo.save(Faq.builder()
            .question(question)
            .answer(answer)
            .category(category)
            .displayOrder(order)
            .active(true)
            .build());
    }

    /**
     * Seeds the 8 legal/policy pages (Terms, Privacy, Return &amp; Refund, Shipping
     * &amp; Delivery, Cancellation, Cookie Policy, Payment Terms, Contact &amp; Support).
     * Idempotent — admins edit, add, reorder, or hide these via the
     * /api/admin/policies endpoints (Admin → Policies). Content uses a lightweight
     * markup convention parsed client-side: "## " headings, "- " bullets, blank
     * lines separate blocks, "[text](url)" and "**text**" for inline links/bold.
     */
    private void seedPolicies() {
        if (policyRepo.count() > 0) return;
        log.info("Seeding policies...");

        LocalDate effective = LocalDate.of(2026, 1, 1);
        LocalDate updated = LocalDate.of(2026, 5, 1);

        seedPolicy("terms-of-service", "Terms of Service",
            "The terms governing your use of Prettycrafted, orders, payments, and returns.",
            """
            ## 1. Acceptance of Terms
            By creating an account, placing an order, or otherwise using the Prettycrafted website and services (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to any part of these Terms, please discontinue use of the Service immediately.

            ## 2. About Prettycrafted
            Prettycrafted is an online marketplace for handcrafted gift boxes and personalised gifts, curated for customers across India. References to "we", "us", or "our" mean Prettycrafted; "you" means the customer using the Service.

            ## 3. Eligibility & Accounts
            You must be at least 18 years old, or using the Service under the supervision of a parent or guardian, to place an order. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at [support@prettycrafted.com](mailto:support@prettycrafted.com) if you suspect unauthorised use.

            ## 4. Products, Pricing & Availability
            - All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes unless stated otherwise at checkout.
            - Product images are for illustrative purposes; as many of our items are handcrafted, slight variations in colour, texture, or finish are normal and not considered defects.
            - We reserve the right to correct pricing errors, limit order quantities, and discontinue any product at any time without prior notice.
            - If an item becomes unavailable after you place an order, we will notify you and issue a full refund for that item.

            ## 5. Orders & Payment
            Placing an order is an offer to purchase, which we accept when we confirm and process your order. Full payment terms — accepted methods, currency, and security — are set out in our [Payment Terms](/payment-terms).

            ## 6. Shipping & Delivery
            Estimated delivery timelines are shown at checkout and are not guaranteed delivery dates. Full details are set out in our [Shipping & Delivery Policy](/shipping-delivery-policy).

            ## 7. Returns, Refunds & Cancellations
            Eligible items may be returned or exchanged within the applicable window described in our [Return & Refund Policy](/return-refund-policy). Orders may be cancelled before they ship, subject to our [Cancellation Policy](/cancellation-policy).

            ## 8. Personalised & Customised Items
            Gift boxes and items that have been personalised, engraved, or made to your specification cannot be returned or exchanged unless they arrive damaged, defective, or materially different from what you ordered.

            ## 9. Intellectual Property
            All content on the Service — including product photography, descriptions, logos, and site design — is owned by Prettycrafted or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from this content without our prior written consent.

            ## 10. User Conduct
            You agree not to misuse the Service, including attempting to gain unauthorised access to our systems, submitting fraudulent orders or payment information, or using the Service for any unlawful purpose.

            ## 11. Limitation of Liability
            To the maximum extent permitted by law, Prettycrafted shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Service. Our total liability for any claim relating to an order shall not exceed the amount you paid for that order.

            ## 12. Indemnity
            You agree to indemnify and hold Prettycrafted harmless from any claims, losses, or damages arising from your breach of these Terms or misuse of the Service.

            ## 13. Governing Law & Jurisdiction
            These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.

            ## 14. Changes to These Terms
            We may update these Terms from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.

            ## 15. Contact Us
            Questions about these Terms? Reach us at [support@prettycrafted.com](mailto:support@prettycrafted.com) or visit our [Contact & Customer Support](/contact-support) page. See also our [Privacy Policy](/privacy) and [Cookie Policy](/cookie-policy).
            """,
            effective, updated, 0);

        seedPolicy("privacy-policy", "Privacy Policy",
            "How Prettycrafted collects, uses, shares, and protects your personal information.",
            """
            ## 1. Introduction
            This Privacy Policy explains how Prettycrafted collects, uses, shares, and protects your personal information when you visit our website or place an order. By using the Service, you consent to the practices described here and in our [Cookie Policy](/cookie-policy).

            ## 2. Information We Collect
            - **Account information**: name, email address, phone number, and password (stored as a secure hash).
            - **Order information**: shipping address, billing details, and items purchased.
            - **Payment information**: processed directly by our payment partner, Razorpay — we never receive or store your full card number or CVV.
            - **Usage information**: pages visited, products viewed, and interactions with the Service, collected to improve your shopping experience.

            ## 3. How We Use Your Information
            - To process, fulfil, and ship your orders, and to send order confirmations and delivery updates.
            - To provide customer support and respond to your enquiries.
            - To send you promotional emails or offers, only where you have opted in — you can unsubscribe at any time.
            - To detect and prevent fraud, and to maintain the security of the Service.
            - To analyse aggregated, anonymised usage trends and improve our products and website.

            ## 4. Cookies & Tracking Technologies
            We use cookies and similar technologies for authentication, shopping cart functionality, and — where you consent — analytics and personalisation. You can review and manage your preferences at any time on our [Cookie Policy & Settings](/cookie-policy) page.

            ## 5. How We Share Your Information
            We do not sell your personal data. We share information only as necessary with:
            - **Payment processors** (Razorpay) to complete and verify transactions.
            - **Shipping and logistics partners** to deliver your orders.
            - **Analytics providers** (PostHog) — aggregated, anonymised usage data only, and only where you have consented to analytics cookies.
            - **Error monitoring providers** (Sentry) — technical diagnostic data used to fix bugs; no payment details are ever included.
            - **Regulators or law enforcement**, where required by law.

            ## 6. Data Retention
            We retain order and transaction records for as long as required under Indian tax and consumer-protection law (generally up to 7 years). If you close your account, we delete or anonymise your personal data within 30 days, except where retention is required for legal or accounting purposes.

            ## 7. Your Rights
            You may request access to, correction of, or deletion of your personal data at any time by emailing [privacy@prettycrafted.com](mailto:privacy@prettycrafted.com). We will respond within 30 days. If you are located in the European Economic Area or United Kingdom, you have additional rights under the GDPR, including data portability and the right to object to processing.

            ## 8. Data Security
            All data is transmitted over encrypted HTTPS connections. Passwords are hashed using industry-standard algorithms and are never stored in plain text. Payment details are handled exclusively by our PCI-DSS compliant payment partner and are never stored on our servers.

            ## 9. Children's Privacy
            The Service is not directed at children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us so we can remove it.

            ## 10. Changes to This Policy
            We may update this Privacy Policy periodically. The "Last updated" date above reflects the most recent revision. Material changes will be highlighted on the storefront.

            ## 11. Contact Us
            Questions about this policy? Email [privacy@prettycrafted.com](mailto:privacy@prettycrafted.com), or visit [Contact & Customer Support](/contact-support). See also our [Terms of Service](/terms).
            """,
            effective, updated, 1);

        seedPolicy("return-refund-policy", "Return & Refund Policy",
            "Eligibility, process, and timelines for returning, exchanging, or getting a refund on your order.",
            """
            ## 1. Our Promise
            We want you to love every Prettycrafted gift. If something isn't right, we make returns and refunds as simple as possible.

            ## 2. Return Eligibility
            - Most items can be returned within **14 days** of delivery.
            - Items must be unused, in their original packaging, and in the same condition you received them.
            - A valid order number is required to initiate a return.

            ## 3. Non-Returnable Items
            - Personalised, engraved, or made-to-order gift boxes, unless they arrive damaged, defective, or different from what you ordered.
            - Perishable items such as chocolates, baked goods, or fresh flowers, unless received in a damaged or spoiled condition.
            - Gift cards.

            ## 4. How to Request a Return or Exchange
            Go to **Account → My Orders → Returns & Exchanges**, select the delivered order and item, choose "Return" or "Exchange", pick a reason, and submit — you can attach photos if the item arrived damaged. You can track the status (Pending, Approved, Rejected, Completed) from the same screen. Alternatively, email [support@prettycrafted.com](mailto:support@prettycrafted.com) with your order number.

            ## 5. Return Shipping
            For returns due to our error (damaged, defective, or incorrect item), we arrange and cover return shipping. For change-of-mind returns, return shipping costs are the customer's responsibility unless otherwise stated at checkout.

            ## 6. Refunds
            Once we receive and inspect your returned item, approved refunds are processed to your original payment method within **5–7 business days**. Cash-on-delivery orders are refunded via bank transfer or UPI — we'll ask for your details during the return process. See our [Payment Terms](/payment-terms) for more on payment methods.

            ## 7. Damaged, Defective or Wrong Items
            If your order arrives damaged, defective, or different from what you ordered, contact us within 48 hours of delivery with photos of the item and packaging, and we will arrange a free replacement or full refund.

            ## 8. Exchanges
            Exchanges are subject to stock availability. If the requested replacement is unavailable, we will offer a refund instead.

            ## 9. Related Policies
            See also our [Shipping & Delivery Policy](/shipping-delivery-policy), [Cancellation Policy](/cancellation-policy), and [Terms of Service](/terms).
            """,
            effective, updated, 2);

        seedPolicy("shipping-delivery-policy", "Shipping & Delivery Policy",
            "Delivery areas, timelines, charges, and what happens if your shipment is delayed or damaged.",
            """
            ## 1. Delivery Areas
            Prettycrafted currently ships to addresses across India. We do not offer international shipping at this time.

            ## 2. Processing Time
            Orders are typically processed and handed to our shipping partners within 1–2 business days of confirmation, excluding weekends and public holidays. Personalised gift boxes may require an additional 1–2 days for preparation.

            ## 3. Estimated Delivery Timelines
            - Metro cities: 3–5 business days after processing.
            - Other cities and towns: 5–8 business days after processing.
            - Remote or rural pin codes: up to 10 business days.

            These are estimates shown at checkout, not guaranteed delivery dates, and may vary based on your location and our shipping partners' schedules.

            ## 4. Shipping Charges
            We currently offer **free standard delivery on every order** across India. Any exceptions (for example, expedited shipping options, if offered) will be clearly shown at checkout before you pay.

            ## 5. Order Tracking
            Once your order ships, a tracking link becomes available on your order detail page under **Account → My Orders**. You will also receive an email/SMS update when your order ships and when it is out for delivery.

            ## 6. Delays & Force Majeure
            While we work with reliable shipping partners, delivery can occasionally be delayed by weather, regional restrictions, courier network disruptions, or other events beyond our reasonable control. We are not liable for delays caused by such events, but we will keep you informed and assist however we can.

            ## 7. Delivery Attempts & Address Accuracy
            Please ensure your shipping address and contact number are accurate and complete. Our courier partners typically attempt delivery up to three times; if delivery fails after repeated attempts, the order may be returned to us, and we will contact you to arrange re-delivery or a refund (shipping charges for re-delivery, if any, may apply).

            ## 8. Damaged-in-Transit Shipments
            If a package appears damaged on arrival, please note this with the delivery courier if possible, and contact us within 48 hours with photos. See our [Return & Refund Policy](/return-refund-policy) for how damaged items are resolved.

            ## 9. Related Policies
            See also our [Return & Refund Policy](/return-refund-policy), [Cancellation Policy](/cancellation-policy), and [Terms of Service](/terms).
            """,
            effective, updated, 3);

        seedPolicy("cancellation-policy", "Cancellation Policy",
            "When and how you can cancel an order, applicable charges, and refund timelines.",
            """
            ## 1. Cancelling Before Shipment
            You may cancel an order free of charge as long as it is still in **Placed** or **Processing** status. Once an order moves to **Shipped**, it can no longer be cancelled — please use our [Return & Refund Policy](/return-refund-policy) process instead once it is delivered.

            ## 2. Cancellation Charges
            For orders already in preparation (for example, personalised gift boxes being assembled), a cancellation charge may apply to cover materials and labour already committed. Any applicable charge is clearly shown before you confirm the cancellation.

            ## 3. How to Cancel
            Go to **Account → My Orders**, select the order, and choose **Cancel Order**. You'll see any applicable cancellation charge before confirming. Alternatively, contact us at [support@prettycrafted.com](mailto:support@prettycrafted.com) with your order number as soon as possible.

            ## 4. Orders That Cannot Be Cancelled
            Orders that have already shipped, and personalised items where production has been completed, cannot be cancelled through self-service. Contact customer support to check if an exception is possible.

            ## 5. Cash on Delivery Orders
            Cash-on-delivery orders can be cancelled the same way as prepaid orders, up until they ship. Repeated cancellations or refusals of COD orders may result in COD being disabled for your account.

            ## 6. Refunds for Cancelled Orders
            If you cancelled a prepaid order, the refund (less any applicable cancellation charge) is credited to your original payment method within **5–7 business days**. See our [Payment Terms](/payment-terms) for details.

            ## 7. Related Policies
            See also our [Return & Refund Policy](/return-refund-policy), [Shipping & Delivery Policy](/shipping-delivery-policy), and [Terms of Service](/terms).
            """,
            effective, updated, 4);

        seedPolicy("cookie-policy", "Cookie Policy & Settings",
            "What cookies Prettycrafted uses, why, and how to manage your preferences.",
            """
            ## 1. What Are Cookies
            Cookies are small text files stored on your device that help websites function and remember your preferences. Prettycrafted also uses similar technologies such as local storage for the same purposes.

            ## 2. Categories of Cookies We Use
            We group cookies into four categories, and you can manage your preferences for each using the panel below (except Essential, which is required for the site to function).

            ## 3. Essential Cookies
            Always active. These are strictly necessary for core functionality — for example, keeping you signed in (our `pc_token` authentication cookie) and remembering the contents of your shopping cart. The Service cannot function properly without these.

            ## 4. Functional Cookies
            Remember your preferences — such as recently viewed products, wishlist items stored locally, and display settings — to make your visit smoother. Disabling these may mean some conveniences reset each visit.

            ## 5. Analytics Cookies
            Help us understand how visitors use Prettycrafted (pages viewed, products browsed, search terms) so we can improve the site. We use PostHog for this, and analytics cookies are only active if you opt in below.

            ## 6. Marketing Cookies
            Used to measure the effectiveness of promotions and, where applicable, to show you more relevant offers. Prettycrafted does not currently run third-party ad-retargeting, but this category is available for future marketing tools and remains off unless you opt in.

            ## 7. Third-Party Cookies
            Some cookies are set by services we rely on, such as our analytics provider (PostHog) and our payment partner (Razorpay) during checkout. These providers have their own privacy and cookie practices.

            ## 8. Managing Your Preferences
            Use the panel below to turn Functional, Analytics, and Marketing cookies on or off, then select **Save Preferences**. You can return to this page and change your choices at any time. See our [Privacy Policy](/privacy) for more on how we handle your data.

            ## 9. Related Policies
            See also our [Privacy Policy](/privacy) and [Terms of Service](/terms).
            """,
            effective, updated, 5);

        seedPolicy("payment-terms", "Payment Terms",
            "Accepted payment methods, currency, security, and how refunds are processed.",
            """
            ## 1. Accepted Payment Methods
            We accept UPI, all major credit and debit cards, and net banking through our secure payment partner, Razorpay. Cash on Delivery (COD) is available for eligible orders and pin codes, shown at checkout.

            ## 2. Currency
            All prices and transactions on Prettycrafted are in Indian Rupees (₹).

            ## 3. Payment Security
            Card and banking details are entered directly into Razorpay's PCI-DSS compliant, encrypted checkout — Prettycrafted never receives or stores your full card number, CVV, or net banking credentials.

            ## 4. Order Confirmation
            Your order is confirmed once payment is successfully authorised (for prepaid orders) or once you complete checkout (for COD orders). You will receive an order confirmation email/SMS with your order number.

            ## 5. Failed or Pending Payments
            If a payment fails or remains pending, your order will not be confirmed and any amount debited (in rare gateway-timeout cases) is automatically reversed by Razorpay within 5–7 business days. If you notice a debit without an order confirmation, contact [support@prettycrafted.com](mailto:support@prettycrafted.com) with your payment reference.

            ## 6. Cash on Delivery
            COD orders are paid in cash (or supported digital modes, where the courier partner allows) at the time of delivery. A COD handling fee, if applicable, is shown clearly at checkout before you confirm your order.

            ## 7. Refunds to Original Payment Method
            Approved refunds — whether from a cancellation or a return — are credited back to your original payment method within **5–7 business days**. COD order refunds are processed via bank transfer or UPI, as described in our [Return & Refund Policy](/return-refund-policy).

            ## 8. Invoicing
            A GST-compliant invoice is generated for every order and available for download from **Account → My Orders → Order Detail**.

            ## 9. Related Policies
            See also our [Return & Refund Policy](/return-refund-policy), [Cancellation Policy](/cancellation-policy), and [Terms of Service](/terms).
            """,
            effective, updated, 6);

        seedPolicy("contact-support", "Contact & Customer Support",
            "How to reach Prettycrafted customer support, our support hours, and grievance redressal.",
            """
            ## 1. Customer Support Channels
            Reach our customer support team by email at [support@prettycrafted.com](mailto:support@prettycrafted.com), or via the live WhatsApp and email options in our in-app **Help Center** (Account → Help Centre). We aim to respond to every enquiry as quickly as possible.

            ## 2. Support Hours
            Our support team is available Monday–Saturday, 10:00 AM–6:00 PM IST, excluding public holidays. Enquiries received outside these hours are answered the next business day.

            ## 3. Grievance Redressal
            In accordance with Indian consumer protection and e-commerce regulations, Prettycrafted has designated a Grievance Officer to address customer complaints that are not resolved through standard support channels.
            - **Grievance Officer**: Customer Care Team, Prettycrafted
            - **Email**: [support@prettycrafted.com](mailto:support@prettycrafted.com)
            - **Response time**: Grievances are acknowledged within 48 hours and resolved within 30 days, as required by law.

            ## 4. Escalations
            If your issue remains unresolved after contacting support, reply to your existing support thread requesting escalation, or mark your email "Escalation" in the subject line. Escalated issues are reviewed directly by the Grievance Officer.

            ## 5. Related Policies
            See also our [Return & Refund Policy](/return-refund-policy), [Cancellation Policy](/cancellation-policy), and [Terms of Service](/terms).
            """,
            effective, updated, 7);

        log.info("Seed complete: {} policies", policyRepo.count());
    }

    private void seedPolicy(String slug, String title, String shortDescription, String content,
            LocalDate effectiveDate, LocalDate lastUpdatedDate, int order) {
        policyRepo.save(Policy.builder()
            .slug(slug)
            .title(title)
            .shortDescription(shortDescription)
            .content(content.strip())
            .effectiveDate(effectiveDate)
            .lastUpdatedDate(lastUpdatedDate)
            .displayOrder(order)
            .active(true)
            .build());
    }

    /**
     * Seeds the "Gifts for Every Occasion" catalog, preserving the exact values the
     * storefront used when this array was hardcoded in HomePage.jsx, so first boot
     * looks identical to before. Idempotent — admins manage this via
     * /api/admin/occasions (Admin → Occasions). Only "mothers" starts {@code active}
     * and {@code featured}, matching today's banner; marking a different occasion
     * featured swaps the banner without any code change.
     */
    private void seedOccasions() {
        if (occasionRepo.count() > 0) return;
        log.info("Seeding occasions...");

        seedOccasion("mothers", "Mother's Day", "Thoughtful gifts made with love", "💐",
            "/occasions/mothers-day.svg", "#F0D5DC", "May", "Shop Mother's Day", true, true, 0);
        seedOccasion("valentines", "Valentine's Day", "Speak love through craft", "💝",
            "/occasions/valentines-day.svg", "#E8C5C5", null, "Shop Love Gifts", false, false, 1);
        seedOccasion("birthday", "Birthday Gifts", "Make birthdays unforgettable", "🎂",
            null, "#E8D5C4", null, "Shop Birthday Gifts", false, false, 2);
        seedOccasion("anniversary", "Anniversary", "Celebrate years of love", "💍",
            null, "#E0D5C5", null, "Shop Anniversary Gifts", false, false, 3);
        seedOccasion("wedding", "Wedding", "For the start of forever", "💒",
            null, "#F2EAE0", null, "Shop Wedding Gifts", false, false, 4);
        seedOccasion("baby", "Baby Shower", "Soft welcomes for tiny humans", "🍼",
            null, "#D8E4DC", null, "Shop Baby Gifts", false, false, 5);
        seedOccasion("graduation", "Graduation", "Mark the milestone", "🎓",
            null, "#D4C5B5", null, "Shop Graduation Gifts", false, false, 6);
        seedOccasion("friendship", "Friendship", "For your favorite person", "🌻",
            null, "#EDD8B0", null, "Shop Friendship Gifts", false, false, 7);
        seedOccasion("christmas", "Christmas", "Wrapped in warmth & wonder", "🎄",
            null, "#C8DBC4", null, "Shop Christmas Gifts", false, false, 8);
        seedOccasion("newyear", "New Year", "Fresh starts, beautiful gifts", "✨",
            null, "#E4D8B0", null, "Shop New Year Gifts", false, false, 9);
        seedOccasion("housewarming", "Housewarming", "Welcome home, with love", "🏡",
            null, "#E0CFB8", null, "Shop Housewarming", false, false, 10);
        seedOccasion("thankyou", "Thank You", "Gratitude, beautifully said", "🌷",
            null, "#E8D0C8", null, null, false, false, 11);
        seedOccasion("him", "For Him", "Crafted for the modern man", "🥃",
            null, "#C4D0C0", null, "Shop Gifts for Him", false, false, 12);
        seedOccasion("her", "For Her", "Refined, romantic, real", "🌹",
            null, "#F0D5DC", null, "Shop Gifts for Her", false, false, 13);
        seedOccasion("kids", "For Kids", "Joy, in every detail", "🧸",
            null, "#D4C0D0", null, "Shop Kids Gifts", false, false, 14);
        seedOccasion("corporate", "Corporate Gifts", "Premium, thoughtful, on-brand", "🎁",
            null, "#D9CFC2", null, "Shop Corporate Gifts", false, false, 15);
        seedOccasion("fathers", "Father's Day", "Honor him in style", "🎩",
            null, "#C8B89A", "June", "Shop Father's Day", false, false, 16);
        seedOccasion("rakshabandhan", "Raksha Bandhan", "Celebrate the sibling bond", "🪢",
            null, "#E8D0B0", "August", "Shop Raksha Bandhan Gifts", false, false, 17);
        seedOccasion("diwali", "Diwali", "Light up their celebrations", "🪔",
            null, "#F0D9A8", "October", "Shop Diwali Gifts", false, false, 18);

        log.info("Seed complete: {} occasions", occasionRepo.count());
    }

    private void seedOccasion(String slug, String title, String description, String icon,
            String iconImageUrl, String color, String season, String ctaLabel,
            boolean active, boolean featured, int displayOrder) {
        occasionRepo.save(Occasion.builder()
            .slug(slug)
            .title(title)
            .description(description)
            .icon(icon)
            .iconImageUrl(iconImageUrl)
            .color(color)
            .season(season)
            .ctaLabel(ctaLabel)
            .active(active)
            .featured(featured)
            .visible(true)
            .displayOrder(displayOrder)
            .build());
    }

    /**
     * One-time self-heal for databases seeded before the {@code featured} column
     * existed: Hibernate's DDL update adds it with a FALSE default on every row, so
     * an already-seeded database would otherwise end up with no featured occasion
     * at all. If nothing is featured yet, feature "mothers" (today's banner) so the
     * homepage doesn't fall back to an arbitrary occasion after this upgrade.
     */
    private void backfillFeaturedOccasion() {
        if (occasionRepo.findByFeaturedTrue().isPresent()) return;
        occasionRepo.findAll().stream()
            .filter(o -> "mothers".equals(o.getSlug()))
            .findFirst()
            .ifPresent(mothers -> {
                mothers.setFeatured(true);
                mothers.setActive(true);
                occasionRepo.save(mothers);
                log.info("Backfilled featured occasion: mothers");
            });
    }
}
