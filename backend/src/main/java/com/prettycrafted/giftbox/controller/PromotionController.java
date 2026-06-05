package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.CouponDto;
import com.prettycrafted.giftbox.service.CouponService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoint the storefront uses to render the announcement banner.
 * Lives under /api/public/** so it bypasses JWT (see SecurityConfig chain 1).
 */
@RestController
@RequestMapping("/api/public/promotions")
@RequiredArgsConstructor
public class PromotionController {
    private final CouponService couponService;

    @GetMapping
    public List<CouponDto> activePromotions() {
        return couponService.listActive();
    }
}
