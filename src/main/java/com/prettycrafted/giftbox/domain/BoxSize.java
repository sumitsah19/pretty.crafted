package com.prettycrafted.giftbox.domain;

import java.math.BigDecimal;

public enum BoxSize {
    SMALL(2, new BigDecimal("199.00")),
    MEDIUM(4, new BigDecimal("349.00")),
    LARGE(6, new BigDecimal("549.00"));

    private final int capacity;
    private final BigDecimal basePrice;

    BoxSize(int capacity, BigDecimal basePrice) {
        this.capacity = capacity;
        this.basePrice = basePrice;
    }

    public int capacity() { return capacity; }
    public BigDecimal basePrice() { return basePrice; }
}
