package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.GiftBoxItem;
import java.math.BigDecimal;

public record GiftBoxItemDto(
    Long productId,
    String productName,
    String productImage,
    BigDecimal price
) {
    public static GiftBoxItemDto from(GiftBoxItem i) {
        return new GiftBoxItemDto(
            i.getProduct().getId(),
            i.getProduct().getName(),
            i.getProduct().getImageUrl(),
            i.getProduct().getPrice()
        );
    }
}
