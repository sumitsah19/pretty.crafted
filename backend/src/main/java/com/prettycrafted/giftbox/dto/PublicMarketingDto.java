package com.prettycrafted.giftbox.dto;

import java.util.List;
import lombok.Data;

/**
 * Storefront-facing marketing config: the announcement-banner lines and
 * whether the banner is shown at all (Admin → Marketing → Storefront Banner).
 * Coupon lines are NOT included — the storefront fetches active promotions
 * from /api/public/promotions and prepends them itself.
 */
@Data
public class PublicMarketingDto {
    private List<String> bannerLines;
    private boolean bannerEnabled;
}
