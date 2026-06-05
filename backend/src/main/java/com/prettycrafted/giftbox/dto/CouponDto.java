package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Coupon;

public record CouponDto(
    Long id,
    String code,
    String disc,
    Integer discountPercent,
    String expires,
    boolean active,
    Integer uses
) {
    public static CouponDto from(Coupon c) {
        return new CouponDto(
            c.getId(),
            c.getCode(),
            c.getDiscountPercent() + "% off",
            c.getDiscountPercent(),
            c.getExpiresOn(),
            c.isActive(),
            c.getUses()
        );
    }
}
