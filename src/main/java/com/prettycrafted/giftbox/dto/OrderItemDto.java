package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.OrderItem;
import java.math.BigDecimal;

public record OrderItemDto(
    Long id,
    String type,
    Long productId,
    Long giftBoxId,
    String itemName,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
) {
    public static OrderItemDto from(OrderItem it) {
        String type = it.getGiftBox() != null ? "GIFT_BOX" : "PRODUCT";
        return new OrderItemDto(
            it.getId(),
            type,
            it.getProduct() != null ? it.getProduct().getId() : null,
            it.getGiftBox() != null ? it.getGiftBox().getId() : null,
            it.getItemName(),
            it.getQuantity(),
            it.getUnitPrice(),
            it.getLineTotal()
        );
    }
}
