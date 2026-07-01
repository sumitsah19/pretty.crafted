package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.ReturnType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateReturnRequest(
    @NotNull Long orderId,
    @NotNull Long orderItemId,
    @NotNull ReturnType type,
    @NotNull @Size(min = 2, max = 120) String reason,
    @Size(max = 2000) String details,
    @Size(max = 6) List<@Size(max = 500) String> images
) {}
