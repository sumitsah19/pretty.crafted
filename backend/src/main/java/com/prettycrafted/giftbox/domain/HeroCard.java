package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An admin-curated card shown in the storefront hero "CoverFlow" carousel.
 * Each card is a single uploaded image (a product shot or a hamper shot) and may
 * optionally deep-link to a product/hamper when clicked.
 */
@Entity
@Table(name = "hero_cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeroCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cloudinary (or other) URL of the card image. */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /** Optional caption rendered on the card. */
    @Column(length = 160)
    private String title;

    /** Whether this card is a product shot or a hamper shot. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private HeroCardType type = HeroCardType.PRODUCT;

    /** Optional product/hamper this card opens when clicked. */
    @Column(name = "linked_product_id")
    private Long linkedProductId;

    /** Lower numbers render first. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;

    /** Hidden from the storefront when false. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true;
}
