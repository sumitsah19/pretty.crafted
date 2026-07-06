package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.PublicMarketingDto;
import com.prettycrafted.giftbox.service.MarketingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Storefront announcement-banner config (lines + visibility), managed from
 * Admin → Marketing. Lives under /api/public/** so it bypasses JWT (see
 * SecurityConfig chain 1). Coupon lines come from /api/public/promotions.
 */
@RestController
@RequestMapping("/api/public/marketing")
@RequiredArgsConstructor
public class PublicMarketingController {
    private final MarketingService service;

    @GetMapping
    public PublicMarketingDto get() {
        return service.getPublic();
    }
}
