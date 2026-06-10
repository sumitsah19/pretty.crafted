package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BuildBox;

public record BuildBoxDto(
    Long id,
    String imageUrl,
    String title,
    Integer displayOrder,
    Boolean active
) {
    public static BuildBoxDto from(BuildBox b) {
        return new BuildBoxDto(
            b.getId(),
            b.getImageUrl(),
            b.getTitle(),
            b.getDisplayOrder(),
            b.getActive()
        );
    }
}
