package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Product;
import java.math.BigDecimal;

public record ProductDto(
    Long id,
    String name,
    String description,
    BigDecimal price,
    Integer stock,
    String imageUrl,
    Long categoryId,
    String categoryName,
    Integer popularityScore
) {
    public static ProductDto from(Product p) {
        return new ProductDto(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getPrice(),
            p.getStock(),
            p.getImageUrl(),
            p.getCategory().getId(),
            p.getCategory().getName(),
            p.getPopularityScore()
        );
    }
}
