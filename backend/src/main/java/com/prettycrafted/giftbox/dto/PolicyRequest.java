package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PolicyRequest(
    @NotBlank @Size(max = 80) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
        message = "slug must be lowercase, hyphen-separated (e.g. terms-of-service)")
    String slug,
    @NotBlank @Size(max = 150) String title,
    @Size(max = 300) String shortDescription,
    @NotBlank String content,
    LocalDate effectiveDate,
    LocalDate lastUpdatedDate,
    Integer displayOrder,
    Boolean active
) {}
