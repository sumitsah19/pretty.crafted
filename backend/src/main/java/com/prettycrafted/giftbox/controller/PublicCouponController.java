package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.CouponDto;
import com.prettycrafted.giftbox.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoint the checkout uses to validate a coupon code before placing
 * the order (shows the discounted total). Validation does NOT consume a use —
 * redemption happens server-side at order placement.
 * Lives under /api/public/** so it bypasses JWT (see SecurityConfig chain 1).
 */
@RestController
@RequestMapping("/api/public/coupons")
@RequiredArgsConstructor
public class PublicCouponController {
    private final CouponService couponService;

    @GetMapping("/validate")
    public CouponDto validate(@RequestParam String code) {
        return couponService.validate(code);
    }
}
