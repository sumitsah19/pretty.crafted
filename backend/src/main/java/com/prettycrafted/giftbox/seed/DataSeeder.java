package com.prettycrafted.giftbox.seed;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.HeroCard;
import com.prettycrafted.giftbox.domain.HeroCardType;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.HeroCardRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
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
     * renders real images out of the box. Idempotent — admins replace these via
     * the /api/admin/hero-cards endpoints.
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
}
