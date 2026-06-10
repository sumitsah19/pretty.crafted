package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.HeroCardDto;
import com.prettycrafted.giftbox.service.HeroCardService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: hero CoverFlow cards for the storefront. */
@RestController
@RequestMapping("/api/public/hero-cards")
@RequiredArgsConstructor
public class HeroCardController {
    private final HeroCardService service;

    @GetMapping
    public List<HeroCardDto> list() {
        return service.listActive();
    }
}
