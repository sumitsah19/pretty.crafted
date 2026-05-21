package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.DashboardStatsDto;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.UpdateStockRequest;
import com.prettycrafted.giftbox.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminService service;

    @GetMapping("/stats")
    public DashboardStatsDto stats() {
        return service.getStats();
    }

    @PatchMapping("/products/{id}/stock")
    public ProductDto updateStock(@PathVariable Long id,
                                  @Valid @RequestBody UpdateStockRequest req) {
        return service.updateStock(id, req);
    }
}
