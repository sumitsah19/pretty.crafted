package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
import java.math.BigDecimal;
import java.util.Comparator;
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
    List<Long> categoryIds,
    List<String> categoryNames,
    Integer popularityScore,
    List<String> recipients,
    String tag,
    BigDecimal rating,
    Integer reviewCount,
    String heroSlot
) {
    public static ProductDto from(Product p) {
        List<String> urls = p.getImages().stream()
            .map(img -> img.getImageUrl())
            .toList();
        String primary = urls.isEmpty() ? p.getImageUrl() : urls.get(0);
        List<Category> sortedCategories = p.getCategories().stream()
            .sorted(Comparator.comparing(Category::getName))
            .toList();
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
            sortedCategories.stream().map(Category::getId).toList(),
            sortedCategories.stream().map(Category::getName).toList(),
            p.getPopularityScore(),
            p.getRecipients().stream().sorted().toList(),
            p.getTag(),
            p.getRating(),
            p.getReviewCount(),
            p.getHeroSlot()
        );
    }
}
