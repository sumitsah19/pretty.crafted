package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Coupon;

/**
 * Coupon shape exposed on unauthenticated endpoints (storefront banner, offers
 * list, checkout validation). Deliberately slimmer than {@link CouponDto}: raw
 * {@code uses}/{@code maxUses} counters and the {@code active} flag are
 * internal bookkeeping — the storefront only needs how many redemptions are
 * left (already shown in the Offers UI), not the running totals.
 */
public record PublicCouponDto(
    Long id,
    String code,
    String disc,
    Integer discountPercent,
    String expires,
    Integer remainingUses
) {
    public static PublicCouponDto from(Coupon c) {
        Integer remaining = c.getMaxUses() == null
            ? null
            : Math.max(0, c.getMaxUses() - (c.getUses() == null ? 0 : c.getUses()));
        return new PublicCouponDto(
            c.getId(),
            c.getCode(),
            c.getDiscountPercent() + "% off",
            c.getDiscountPercent(),
            c.getExpiresOn(),
            remaining
        );
    }
}
