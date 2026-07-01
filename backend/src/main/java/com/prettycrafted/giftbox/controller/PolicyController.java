package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.PolicyDto;
import com.prettycrafted.giftbox.service.PolicyService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public: legal/policy pages (Terms, Privacy, Returns, Shipping, etc.) for the storefront. */
@RestController
@RequestMapping("/api/public/policies")
@RequiredArgsConstructor
public class PolicyController {
    private final PolicyService service;

    @GetMapping
    public List<PolicyDto> list() {
        return service.listActive();
    }

    @GetMapping("/{slug}")
    public PolicyDto get(@PathVariable String slug) {
        return service.getBySlug(slug);
    }
}
