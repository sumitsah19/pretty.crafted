package com.prettycrafted.giftbox.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminCustomerDto(
    Long id,
    String name,
    String email,
    String phone,
    boolean emailVerified,
    Instant joinedAt,
    long totalOrders,
    BigDecimal totalSpent
) {}
