package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BuildBoxRequest(
    @NotBlank @Size(max = 500) String imageUrl,
    @Size(max = 160) String title,
    Integer displayOrder,
    Boolean active
) {}
