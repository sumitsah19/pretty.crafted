package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BuildBox;
import java.math.BigDecimal;

public record BuildBoxDto(
    Long id,
    String imageUrl,
    String title,
    BigDecimal priceSmall,
    BigDecimal priceMedium,
    BigDecimal priceLarge,
    Integer displayOrder,
    Boolean active
) {
    public static BuildBoxDto from(BuildBox b) {
        return new BuildBoxDto(
            b.getId(),
            b.getImageUrl(),
            b.getTitle(),
            b.getPriceSmall(),
            b.getPriceMedium(),
            b.getPriceLarge(),
            b.getDisplayOrder(),
            b.getActive()
        );
    }
}
