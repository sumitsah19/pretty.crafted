package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OccasionRequest(
    @NotBlank @Size(max = 60) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
        message = "slug must be lowercase, hyphen-separated (e.g. rakshabandhan or raksha-bandhan)")
    String slug,
    @NotBlank @Size(max = 120) String title,
    @NotBlank @Size(max = 200) String description,
    @Size(max = 16) String icon,
    @Size(max = 500) String iconImageUrl,
    @NotBlank @Size(max = 20) String color,
    @Size(max = 40) String season,
    @Size(max = 60) String ctaLabel,
    Boolean active,
    Integer priority,
    Integer displayOrder
) {}
