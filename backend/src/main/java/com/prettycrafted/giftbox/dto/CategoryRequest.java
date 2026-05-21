package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Size(max = 80) @Pattern(regexp = "[a-z0-9-]+", message = "lowercase letters, digits and hyphens only") String slug,
    @Size(max = 500) String description,
    @Size(max = 500) String imageUrl
) {}
