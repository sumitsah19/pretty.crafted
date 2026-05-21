package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.OrderDto;
import com.prettycrafted.giftbox.dto.PlaceOrderRequest;
import com.prettycrafted.giftbox.dto.PlaceOrderResponse;
import com.prettycrafted.giftbox.dto.VerifyPaymentRequest;
import com.prettycrafted.giftbox.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceOrderResponse place(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PlaceOrderRequest req) {
        return service.place(userId(jwt), req);
    }

    @GetMapping
    public Page<OrderDto> myOrders(@AuthenticationPrincipal Jwt jwt,
                                   @PageableDefault(size = 20) Pageable pageable) {
        return service.myOrders(userId(jwt), pageable);
    }

    @GetMapping("/{id}")
    public OrderDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.get(userId(jwt), id);
    }

    @PostMapping("/{id}/payment/verify")
    public OrderDto verifyPayment(@AuthenticationPrincipal Jwt jwt,
                                  @PathVariable Long id,
                                  @Valid @RequestBody VerifyPaymentRequest req) {
        return service.verifyPayment(userId(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    public OrderDto cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.cancelOrder(userId(jwt), id);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
