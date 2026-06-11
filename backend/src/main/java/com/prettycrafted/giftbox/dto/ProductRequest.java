package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
    @NotBlank @Size(max = 160) String name,
    @Size(max = 20000) String description,
    @Size(max = 20000) String materials,
    @Size(max = 20000) String care,
    @Size(max = 20000) String shippingAndReturns,
    @NotNull @DecimalMin("0.00") BigDecimal price,
    // Original price / MRP for the strike-through. Optional; ignored by the UI unless > price.
    @PositiveOrZero BigDecimal originalPrice,
    @NotNull @Min(0) Integer stock,
    List<String> imageUrls,
    @NotNull Long categoryId,
    @Size(max = 10) String recipient,
    @Size(max = 30) String tag,
    // Star rating (0–5) and review count shown on the product card. Both optional.
    @DecimalMin("0.0") @DecimalMax("5.0") BigDecimal rating,
    @PositiveOrZero Integer reviewCount
) {}
