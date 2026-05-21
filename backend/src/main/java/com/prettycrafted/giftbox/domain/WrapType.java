package com.prettycrafted.giftbox.domain;

import java.math.BigDecimal;

public enum WrapType {
    STANDARD("Standard Pink", BigDecimal.ZERO),
    ROSE_GOLD("Rose Gold Foil", new BigDecimal("79.00")),
    FLORAL("Floral Ribbon", new BigDecimal("49.00")),
    LUXURY("Luxury Velvet", new BigDecimal("129.00"));

    private final String displayName;
    private final BigDecimal extraCost;

    WrapType(String displayName, BigDecimal extraCost) {
        this.displayName = displayName;
        this.extraCost = extraCost;
    }

    public String displayName() { return displayName; }
    public BigDecimal extraCost() { return extraCost; }
}
