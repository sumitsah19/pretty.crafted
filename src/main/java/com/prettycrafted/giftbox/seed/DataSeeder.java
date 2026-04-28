package com.prettycrafted.giftbox.seed;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedCatalog();
    }

    private void seedAdmin() {
        String adminEmail = "admin@prettycrafted.local";
        if (userRepo.existsByEmail(adminEmail)) return;
        userRepo.save(User.builder()
            .email(adminEmail)
            .passwordHash(passwordEncoder.encode("admin1234"))
            .name("Pretty Crafted Admin")
            .role(Role.ADMIN)
            .build());
        log.info("Seeded admin user: {} / admin1234", adminEmail);
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
        productRepo.save(Product.builder()
            .name(name)
            .description(desc)
            .price(new BigDecimal(price))
            .stock(stock)
            .category(c)
            .popularityScore(0)
            .build());
    }
}
