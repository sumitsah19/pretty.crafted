package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Policy;
import java.time.LocalDate;

public record PolicyDto(
    Long id,
    String slug,
    String title,
    String shortDescription,
    String content,
    LocalDate effectiveDate,
    LocalDate lastUpdatedDate,
    Integer displayOrder,
    Boolean active
) {
    public static PolicyDto from(Policy p) {
        return new PolicyDto(
            p.getId(),
            p.getSlug(),
            p.getTitle(),
            p.getShortDescription(),
            p.getContent(),
            p.getEffectiveDate(),
            p.getLastUpdatedDate(),
            p.getDisplayOrder(),
            p.getActive()
        );
    }
}
