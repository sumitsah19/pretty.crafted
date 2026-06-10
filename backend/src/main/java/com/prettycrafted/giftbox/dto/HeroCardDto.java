package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.HeroCard;
import com.prettycrafted.giftbox.domain.HeroCardType;

public record HeroCardDto(
    Long id,
    String imageUrl,
    String title,
    HeroCardType type,
    Long linkedProductId,
    Integer displayOrder,
    Boolean active
) {
    public static HeroCardDto from(HeroCard c) {
        return new HeroCardDto(
            c.getId(),
            c.getImageUrl(),
            c.getTitle(),
            c.getType(),
            c.getLinkedProductId(),
            c.getDisplayOrder(),
            c.getActive()
        );
    }
}
