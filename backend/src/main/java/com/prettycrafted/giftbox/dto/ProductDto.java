package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Product;
import java.math.BigDecimal;
import java.util.List;

public record ProductDto(
    Long id,
    String name,
    String description,
    String materials,
    String care,
    String shippingAndReturns,
    BigDecimal price,
    BigDecimal originalPrice,
    Integer stock,
    String imageUrl,
    List<String> imageUrls,
    Long categoryId,
    String categoryName,
    Integer popularityScore,
    String recipient,
    String tag,
    BigDecimal rating,
    Integer reviewCount
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
            p.getMaterials(),
            p.getCare(),
            p.getShippingAndReturns(),
            p.getPrice(),
            p.getOriginalPrice(),
            p.getStock(),
            primary,
            urls,
            p.getCategory().getId(),
            p.getCategory().getName(),
            p.getPopularityScore(),
            p.getRecipient(),
            p.getTag(),
            p.getRating(),
            p.getReviewCount()
        );
    }
}
