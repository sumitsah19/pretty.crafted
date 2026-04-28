package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.WrapType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateGiftBoxRequest(
    @NotNull BoxSize size,
    @NotNull WrapType wrapType,
    @Size(max = 150) String customMessage,
    @NotEmpty List<@NotNull Long> productIds
) {}
