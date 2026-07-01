package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.OccasionDto;
import com.prettycrafted.giftbox.service.OccasionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: the "Gifts for Every Occasion" catalog, including the featured banner. */
@RestController
@RequestMapping("/api/public/occasions")
@RequiredArgsConstructor
public class OccasionController {
    private final OccasionService service;

    @GetMapping
    public List<OccasionDto> list() {
        return service.listVisible();
    }
}
