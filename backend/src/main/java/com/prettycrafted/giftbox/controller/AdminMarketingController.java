package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.MarketingDto;
import com.prettycrafted.giftbox.service.MarketingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/marketing")
@RequiredArgsConstructor
public class AdminMarketingController {
    private final MarketingService service;

    @GetMapping
    public MarketingDto get() {
        return service.get();
    }

    @PutMapping
    public MarketingDto update(@RequestBody MarketingDto dto) {
        return service.update(dto);
    }
}
