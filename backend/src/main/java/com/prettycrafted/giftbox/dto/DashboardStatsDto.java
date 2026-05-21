package com.prettycrafted.giftbox.dto;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardStatsDto(
    BigDecimal totalRevenue,
    long totalOrders,
    Map<String, Long> ordersByStatus,
    long totalProducts,
    long lowStockProducts
) {}
