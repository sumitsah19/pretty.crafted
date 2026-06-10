package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * An admin-curated box shown in the storefront "Build Your Own Box" CoverFlow carousel.
 * Each box is a single uploaded image with an optional caption. Clicking a box opens the
 * box builder, so — unlike a {@link HeroCard} — it carries no type or product deep-link.
 */
@Entity
@Table(name = "build_boxes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildBox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cloudinary (or other) URL of the box image. */
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    /** Optional caption rendered on the box. */
    @Column(length = 160)
    private String title;

    /** Lower numbers render first. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;

    /** Hidden from the storefront when false. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true;
}
