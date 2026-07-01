package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Data;

@Data
public class MarketingDto {
    private Long id;

    // The scrolling storefront banner. Admin-trusted, but bound so a runaway
    // list or an overlong line can't break the marquee layout/animation.
    @Size(max = 20, message = "at most 20 banner lines")
    private List<@Size(max = 160, message = "each banner line must be 160 characters or fewer") String> bannerLines;
}
