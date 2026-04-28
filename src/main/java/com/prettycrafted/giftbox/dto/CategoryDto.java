package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Category;

public record CategoryDto(Long id, String name, String slug, String description, String imageUrl) {
    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getSlug(), c.getDescription(), c.getImageUrl());
    }
}
