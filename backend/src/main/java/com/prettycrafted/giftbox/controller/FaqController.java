package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.FaqDto;
import com.prettycrafted.giftbox.service.FaqService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: Help Center FAQs for the storefront accordion. */
@RestController
@RequestMapping("/api/public/faqs")
@RequiredArgsConstructor
public class FaqController {
    private final FaqService service;

    @GetMapping
    public List<FaqDto> list() {
        return service.listActive();
    }
}
