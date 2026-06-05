package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    /** Free-form expiry label, e.g. "2026-06-30" or "No expiry". */
    @Column(name = "expires_on", length = 40)
    private String expiresOn;

    @Column(nullable = false, columnDefinition = "BIT(1) NOT NULL DEFAULT 1")
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false, columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer uses = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
