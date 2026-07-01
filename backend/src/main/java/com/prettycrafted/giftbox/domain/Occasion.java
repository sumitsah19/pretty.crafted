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
 * Three independent flags control where it appears:
 * <ul>
 *   <li>{@code visible} — Hide/Show. Hidden occasions never appear on the storefront
 *       (browse row or featured banner) but remain manageable in the admin panel.</li>
 *   <li>{@code active} — eligibility for the featured banner slot.</li>
 *   <li>{@code featured} — the single occasion actually shown in the banner slot.
 *       At most one occasion has {@code featured=true} at a time; the service
 *       enforces this by unsetting it on any other occasion when one is marked
 *       featured. The banner only honours it while the occasion is also
 *       {@code active} — see {@link com.prettycrafted.giftbox.service.OccasionService}.</li>
 * </ul>
 * {@code slug} should match a key in OccasionPage.jsx's {@code OCC_CFG} map when one
 * exists, so clicking through from the banner still gets themed hero copy.
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

    /** The single occasion shown in the featured banner slot. At most one row is true. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT FALSE")
    @Builder.Default
    private Boolean featured = false;

    /** Hide/Show. Hidden occasions are excluded from every public listing. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT TRUE")
    @Builder.Default
    private Boolean visible = true;

    /** Lower numbers render first in the browse-by-moment row. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;
}
