package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Faq;

public record FaqDto(
    Long id,
    String question,
    String answer,
    String category,
    Integer displayOrder,
    Boolean active
) {
    public static FaqDto from(Faq f) {
        return new FaqDto(
            f.getId(),
            f.getQuestion(),
            f.getAnswer(),
            f.getCategory(),
            f.getDisplayOrder(),
            f.getActive()
        );
    }
}
