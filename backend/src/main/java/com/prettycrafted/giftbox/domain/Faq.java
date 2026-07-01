package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An admin-managed Help Center FAQ entry. Rendered as an interactive accordion on
 * the storefront Help Center and fully editable from the admin CMS. Grouped by an
 * optional {@code category} label so related questions can be sectioned together.
 */
@Entity
@Table(name = "faqs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Faq {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 280)
    private String question;

    /** Long-form answer; rendered as plain text in the accordion body. */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    /** Optional grouping label, e.g. "Orders", "Payments", "Returns". */
    @Column(length = 80)
    private String category;

    /** Lower numbers render first. */
    @Column(name = "display_order", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer displayOrder = 0;

    /** Hidden from the storefront when false. */
    @Column(columnDefinition = "BOOLEAN NOT NULL DEFAULT TRUE")
    @Builder.Default
    private Boolean active = true;
}
