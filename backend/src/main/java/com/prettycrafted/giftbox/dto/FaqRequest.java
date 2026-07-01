package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FaqRequest(
    @NotBlank @Size(max = 280) String question,
    @NotBlank String answer,
    @Size(max = 80) String category,
    Integer displayOrder,
    Boolean active
) {}
