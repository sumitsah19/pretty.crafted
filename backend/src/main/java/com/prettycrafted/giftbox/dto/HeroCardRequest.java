package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.HeroCardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HeroCardRequest(
    @NotBlank @Size(max = 500) String imageUrl,
    @Size(max = 160) String title,
    @NotNull HeroCardType type,
    Long linkedProductId,
    Integer displayOrder,
    Boolean active
) {}
