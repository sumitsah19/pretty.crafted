package com.prettycrafted.giftbox.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "popularity_score", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer popularityScore = 0;

    /** Target audience: "her", "him", "kids", or "all" */
    @Column(name = "recipient", columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'all'")
    @Builder.Default
    private String recipient = "all";

    /** Display badge: "Bestseller", "New", or "" */
    @Column(name = "tag", columnDefinition = "VARCHAR(30) NOT NULL DEFAULT ''")
    @Builder.Default
    private String tag = "";

    /**
     * Average star rating (0–5) and the number of reviews behind it. Admin-managed snapshots
     * surfaced on product cards; the product detail page computes its own figures from live
     * {@link Review} rows, so these are display defaults, not derived values. Null when not set.
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
