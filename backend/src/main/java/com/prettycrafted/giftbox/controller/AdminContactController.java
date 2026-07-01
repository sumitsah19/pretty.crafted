package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.ContactConfigDto;
import com.prettycrafted.giftbox.service.ContactConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin: manage support contact channels (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/contact")
@RequiredArgsConstructor
public class AdminContactController {
    private final ContactConfigService service;

    @GetMapping
    public ContactConfigDto get() {
        return service.get();
    }

    @PutMapping
    public ContactConfigDto update(@RequestBody ContactConfigDto dto) {
        return service.update(dto);
    }
}
