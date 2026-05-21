package com.prettycrafted.giftbox.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartView(
    List<CartItemDto> items,
    List<GiftBoxDto> giftBoxes,
    BigDecimal subtotal,
    BigDecimal total,
    int totalLineCount
) {}
