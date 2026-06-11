package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.WrapType;
import java.math.BigDecimal;
import java.util.List;

public record GiftBoxDto(
    Long id,
    BoxSize size,
    Integer capacity,
    WrapType wrapType,
    String wrapName,
    String customMessage,
    Long buildBoxId,
    String boxTitle,
    String boxImageUrl,
    BigDecimal basePrice,
    BigDecimal wrapPrice,
    BigDecimal productsTotal,
    BigDecimal totalPrice,
    GiftBoxStatus status,
    List<GiftBoxItemDto> items
) {
    public static GiftBoxDto from(GiftBox b) {
        return new GiftBoxDto(
            b.getId(),
            b.getSize(),
            b.getSize().capacity(),
            b.getWrapType(),
            b.getWrapType().displayName(),
            b.getCustomMessage(),
            b.getBuildBoxId(),
            b.getBoxTitle(),
            b.getBoxImageUrl(),
            b.getBasePrice(),
            b.getWrapPrice(),
            b.getProductsTotal(),
            b.getTotalPrice(),
            b.getStatus(),
            b.getItems().stream().map(GiftBoxItemDto::from).toList()
        );
    }
}
