package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.AddCartItemRequest;
import com.prettycrafted.giftbox.dto.CartItemDto;
import com.prettycrafted.giftbox.dto.CartView;
import com.prettycrafted.giftbox.dto.UpdateCartItemRequest;
import com.prettycrafted.giftbox.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService service;

    @GetMapping
    public CartView view(@AuthenticationPrincipal Jwt jwt) {
        return service.view(userId(jwt));
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartItemDto add(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddCartItemRequest req) {
        return service.add(userId(jwt), req);
    }

    @PatchMapping("/items/{id}")
    public CartItemDto update(@AuthenticationPrincipal Jwt jwt,
                              @PathVariable Long id,
                              @Valid @RequestBody UpdateCartItemRequest req) {
        return service.update(userId(jwt), id, req);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.remove(userId(jwt), id);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal Jwt jwt) {
        service.clear(userId(jwt));
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
