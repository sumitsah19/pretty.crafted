package com.prettycrafted.giftbox.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Rich-text: what the product is made of (admin-managed). */
    @Column(columnDefinition = "TEXT")
    private String materials;

    /** Rich-text: care instructions (admin-managed). */
    @Column(columnDefinition = "TEXT")
    private String care;

    /** Rich-text: shipping & returns policy for this product (admin-managed). */
    @Column(name = "shipping_and_returns", columnDefinition = "TEXT")
    private String shippingAndReturns;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * The original price / MRP shown struck-through next to {@link #price}. Optional — when null or
     * not greater than {@code price}, the UI hides the strike-through and discount badge.
     */
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /**
     * A product can belong to more than one category (e.g. a scented candle listed
     * under both "Candles & Scents" and "Hampers"). Superseded the old single
     * required {@code category_id} column — see {@code product_categories} join
     * table and {@code DataSeeder.backfillCategoriesAndRecipients()} for the
     * one-time migration off that legacy column.
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "product_categories",
        joinColumns = @JoinColumn(name = "product_id"),
        inverseJoinColumns = @JoinColumn(name = "category_id"))
    @BatchSize(size = 20)
    @Builder.Default
    private Set<Category> categories = new LinkedHashSet<>();

    @Column(name = "popularity_score", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer popularityScore = 0;

    /**
     * Target audience — any combination of "her", "him", "kids". Empty means the
     * product isn't targeted at a specific recipient and shows for everyone
     * (equivalent to the old default value "all"). Superseded the old single
     * {@code recipient} column — see {@code product_recipients} collection table.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_recipients", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "recipient", length = 10)
    @BatchSize(size = 20)
    @Builder.Default
    private Set<String> recipients = new LinkedHashSet<>();

    /** Display badge: "Bestseller", "New", or "" */
    @Column(name = "tag", columnDefinition = "VARCHAR(30) NOT NULL DEFAULT ''")
    @Builder.Default
    private String tag = "";

    /**
     * Admin-curated placement in one of the homepage hero carousel's 3 fixed
     * category slots: "family", "her", or "accessories" (matching the cards in
     * {@code Hero.jsx}). Null means not featured there. A product can only be
     * placed in one slot at a time. When a slot has no curated products yet, the
     * storefront falls back to a heuristic (recipient/category match) so the
     * card is never empty — see {@code Hero.jsx}.
     */
    @Column(name = "hero_slot", length = 20)
    private String heroSlot;

    /**
     * Average star rating (0–5) and the number of reviews behind it — a denormalised
     * snapshot of real {@link Review} rows, surfaced on product cards so the storefront
     * doesn't need a review fetch per card. Recomputed exclusively by
     * {@code ReviewService.submitReview()}; never admin-editable. Null when the
     * product has no reviews yet (the storefront hides stars until then).
     */
    @Column(precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "review_count")
    private Integer reviewCount;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @BatchSize(size = 20)
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();
}
