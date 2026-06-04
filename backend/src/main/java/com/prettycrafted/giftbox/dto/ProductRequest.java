package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
    @NotBlank @Size(max = 160) String name,
    @Size(max = 1000) String description,
    @NotNull @DecimalMin("0.00") BigDecimal price,
    @NotNull @Min(0) Integer stock,
    List<String> imageUrls,
    @NotNull Long categoryId,
    @Size(max = 10) String recipient,
    @Size(max = 30) String tag
) {}
