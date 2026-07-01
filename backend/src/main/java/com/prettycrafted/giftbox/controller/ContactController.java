package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.ContactConfigDto;
import com.prettycrafted.giftbox.service.ContactConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: support contact channels for the Help Center "Contact Us" action. */
@RestController
@RequestMapping("/api/public/contact")
@RequiredArgsConstructor
public class ContactController {
    private final ContactConfigService service;

    @GetMapping
    public ContactConfigDto get() {
        return service.get();
    }
}
