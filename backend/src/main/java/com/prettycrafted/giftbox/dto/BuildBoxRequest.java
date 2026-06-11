package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record BuildBoxRequest(
    @NotBlank @Size(max = 500) String imageUrl,
    @Size(max = 160) String title,
    @PositiveOrZero BigDecimal price,
    Integer displayOrder,
    Boolean active
) {}
