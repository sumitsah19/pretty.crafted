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
    Boolean featured,
    Boolean visible,
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
            o.getFeatured(),
            o.getVisible(),
            o.getDisplayOrder()
        );
    }
}
