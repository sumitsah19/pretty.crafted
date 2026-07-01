package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

// Deliberately no `rating`/`reviewCount` fields here — those are a snapshot of
// real Review rows, recomputed exclusively by ReviewService.submitReview() and
// never admin-editable. See Product's class doc.
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
    // A product can belong to more than one category — see Product's class doc.
    @NotEmpty List<Long> categoryIds,
    // Any combination of "her"/"him"/"kids"; empty (or omitted) means it shows for everyone.
    List<String> recipients,
    @Size(max = 30) String tag,
    // One of the 3 homepage hero carousel slots, or null for "not featured there".
    @Pattern(regexp = "^(family|her|accessories)$", message = "heroSlot must be one of: family, her, accessories")
    String heroSlot
) {}
