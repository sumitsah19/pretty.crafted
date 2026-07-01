package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.ReturnStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateReturnStatusRequest(
    @NotNull ReturnStatus status,
    @Size(max = 500) String adminNote
) {}
