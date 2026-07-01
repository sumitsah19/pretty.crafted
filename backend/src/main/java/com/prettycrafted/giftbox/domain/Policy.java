package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An admin-managed legal/policy document (Terms, Privacy, Return & Refund, etc.)
 * rendered on a public storefront page and fully editable from the admin CMS.
 * {@code content} uses a lightweight markup convention parsed client-side:
 * "## " starts a heading, "- " starts a bullet, blank lines separate blocks,
 * and "[text](url)" renders an inline link.
 */
@Entity
@Table(name = "policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Policy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** URL-safe identifier, e.g. "terms-of-service". Unique. */
    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 150)
    private String title;

    /** Short summary used for SEO meta description / list views. */
    @Column(length = 300)
    private String shortDescription;

    /** Lightweight-markup body; see class doc for the parsing convention. */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private LocalDate effectiveDate;

    private LocalDate lastUpdatedDate;

    /** Lower numbers render first in listings. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;

    /** Hidden from the storefront when false. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true;
}
