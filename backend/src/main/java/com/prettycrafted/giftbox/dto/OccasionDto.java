package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Occasion;

public record OccasionDto(
    Long id,
    String slug,
    String title,
    String description,
    String icon,
    String iconImageUrl,
    String color,
    String season,
    String ctaLabel,
    Boolean active,
    Integer priority,
    Integer displayOrder
) {
    public static OccasionDto from(Occasion o) {
        return new OccasionDto(
            o.getId(),
            o.getSlug(),
            o.getTitle(),
            o.getDescription(),
            o.getIcon(),
            o.getIconImageUrl(),
            o.getColor(),
            o.getSeason(),
            o.getCtaLabel(),
            o.getActive(),
            o.getPriority(),
            o.getDisplayOrder()
        );
    }
}
