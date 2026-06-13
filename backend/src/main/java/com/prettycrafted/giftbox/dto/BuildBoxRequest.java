package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record BuildBoxRequest(
    @NotBlank @Size(max = 500) String imageUrl,
    @Size(max = 160) String title,
    // Per-size base price (replaces the BoxSize fee for the chosen size). Each is
    // optional; a null falls back to the BoxSize enum base for that size.
    @PositiveOrZero BigDecimal priceSmall,
    @PositiveOrZero BigDecimal priceMedium,
    @PositiveOrZero BigDecimal priceLarge,
    Integer displayOrder,
    Boolean active
) {}
