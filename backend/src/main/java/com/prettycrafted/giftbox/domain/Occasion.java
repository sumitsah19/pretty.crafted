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
 * An admin-managed occasion in the storefront's "Gifts for Every Occasion" catalog.
 * Every occasion (active or not) renders in the browse row; {@code active} only
 * controls eligibility for the single large featured banner slot, and among
 * active occasions the highest {@code priority} wins that slot — see HomePage's
 * {@code featuredOcc} selection. {@code slug} should match a key in
 * OccasionPage.jsx's {@code OCC_CFG} map when one exists, so clicking through
 * from the banner still gets themed hero copy.
 */
@Entity
@Table(name = "occasions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Occasion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** URL-safe identifier, e.g. "mothers", "fathers", "diwali". Unique. */
    @Column(nullable = false, unique = true, length = 60)
    private String slug;

    @Column(nullable = false, length = 120)
    private String title;

    /** Short one-line description shown under the title. */
    @Column(nullable = false, length = 200)
    private String description;

    /** Emoji fallback icon, used when no image is set. */
    @Column(length = 16)
    private String icon;

    /** Optional uploaded image URL, preferred over {@code icon} when present. */
    @Column(name = "icon_image_url", length = 500)
    private String iconImageUrl;

    /** Hex color driving the banner/card gradient background. */
    @Column(nullable = false, length = 20)
    private String color;

    /** Optional seasonal label, e.g. "May" — shown as "Featured this {season}". */
    @Column(length = 40)
    private String season;

    /** Banner CTA text; the storefront falls back to "Shop the Edit" when null. */
    @Column(name = "cta_label", length = 60)
    private String ctaLabel;

    /** Featured-banner eligibility. Does not hide the occasion from the browse row. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT FALSE")
    @Builder.Default
    private Boolean active = false;

    /** Tiebreaker among active occasions — higher wins the featured banner slot. */
    @Column(columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer priority = 0;

    /** Lower numbers render first in the browse-by-moment row. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;
}
