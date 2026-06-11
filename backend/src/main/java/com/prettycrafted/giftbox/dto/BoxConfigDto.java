package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.BoxSize;
import com.prettycrafted.giftbox.domain.WrapType;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

/**
 * The gift-box builder's pricing configuration: box sizes (capacity + base fee) and wrap
 * options (extra cost). Served publicly so the frontend never hardcodes prices that must
 * match the {@link BoxSize} / {@link WrapType} enums.
 */
public record BoxConfigDto(
    List<Size> sizes,
    List<Wrap> wraps
) {
    public record Size(String key, int capacity, BigDecimal basePrice) {}

    public record Wrap(String key, String displayName, BigDecimal extraCost) {}

    public static BoxConfigDto current() {
        return new BoxConfigDto(
            Arrays.stream(BoxSize.values())
                .map(s -> new Size(s.name(), s.capacity(), s.basePrice()))
                .toList(),
            Arrays.stream(WrapType.values())
                .map(w -> new Wrap(w.name(), w.displayName(), w.extraCost()))
                .toList()
        );
    }
}
