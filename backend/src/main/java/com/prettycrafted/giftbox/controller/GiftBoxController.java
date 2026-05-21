package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.CreateGiftBoxRequest;
import com.prettycrafted.giftbox.dto.GiftBoxDto;
import com.prettycrafted.giftbox.service.GiftBoxService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gift-boxes")
@RequiredArgsConstructor
public class GiftBoxController {
    private final GiftBoxService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GiftBoxDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateGiftBoxRequest req) {
        return service.create(userId(jwt), req);
    }

    @GetMapping("/{id}")
    public GiftBoxDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.get(userId(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(userId(jwt), id);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
