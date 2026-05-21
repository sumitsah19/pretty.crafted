package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.CartItem;
import java.math.BigDecimal;

public record CartItemDto(
    Long id,
    Long productId,
    String productName,
    String productImage,
    BigDecimal unitPrice,
    Integer quantity,
    BigDecimal lineTotal
) {
    public static CartItemDto from(CartItem ci) {
        BigDecimal unit = ci.getProduct().getPrice();
        BigDecimal line = unit.multiply(BigDecimal.valueOf(ci.getQuantity()));
        return new CartItemDto(
            ci.getId(),
            ci.getProduct().getId(),
            ci.getProduct().getName(),
            ci.getProduct().getImageUrl(),
            unit,
            ci.getQuantity(),
            line
        );
    }
}
