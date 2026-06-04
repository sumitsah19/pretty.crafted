package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Product;
import java.math.BigDecimal;
import java.util.List;

public record ProductDto(
    Long id,
    String name,
    String description,
    BigDecimal price,
    Integer stock,
    String imageUrl,
    List<String> imageUrls,
    Long categoryId,
    String categoryName,
    Integer popularityScore,
    String recipient,
    String tag
) {
    public static ProductDto from(Product p) {
        List<String> urls = p.getImages().stream()
            .map(img -> img.getImageUrl())
            .toList();
        String primary = urls.isEmpty() ? p.getImageUrl() : urls.get(0);
        return new ProductDto(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getPrice(),
            p.getStock(),
            primary,
            urls,
            p.getCategory().getId(),
            p.getCategory().getName(),
            p.getPopularityScore(),
            p.getRecipient(),
            p.getTag()
        );
    }
}
