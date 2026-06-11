package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.BoxConfigDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoint the gift-box builder uses for box-size and wrap pricing, so the
 * frontend always displays exactly what GiftBoxService will charge.
 * Lives under /api/public/** so it bypasses JWT (see SecurityConfig chain 1).
 */
@RestController
@RequestMapping("/api/public/box-config")
public class BoxConfigController {

    @GetMapping
    public BoxConfigDto get() {
        return BoxConfigDto.current();
    }
}
