package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.dto.OrderDto;
import com.prettycrafted.giftbox.dto.UpdateOrderStatusRequest;
import com.prettycrafted.giftbox.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService service;

    @GetMapping
    public Page<OrderDto> list(@RequestParam(required = false) OrderStatus status,
                               @PageableDefault(size = 20) Pageable pageable) {
        return service.adminListOrders(status, pageable);
    }

    @PatchMapping("/{id}/status")
    public OrderDto updateStatus(@PathVariable Long id,
                                 @Valid @RequestBody UpdateOrderStatusRequest req) {
        return service.adminUpdateStatus(id, req);
    }
}
