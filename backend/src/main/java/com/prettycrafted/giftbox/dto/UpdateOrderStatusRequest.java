package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
    @NotNull OrderStatus status
) {}
