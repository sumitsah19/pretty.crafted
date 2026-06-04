package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.AdminCustomerDto;
import com.prettycrafted.giftbox.dto.DashboardStatsDto;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.UpdateStockRequest;
import com.prettycrafted.giftbox.service.AdminService;
import com.prettycrafted.giftbox.service.EmailService;
import jakarta.validation.Valid;
import java.util.Map;
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
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminService service;
    private final EmailService emailService;

    @GetMapping("/stats")
    public DashboardStatsDto stats() {
        return service.getStats();
    }

    @GetMapping("/customers")
    public Page<AdminCustomerDto> customers(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.getCustomers(q, pageable);
    }

    @PatchMapping("/products/{id}/stock")
    public ProductDto updateStock(@PathVariable Long id,
                                  @Valid @RequestBody UpdateStockRequest req) {
        return service.updateStock(id, req);
    }

    @GetMapping("/test-email")
    public Map<String, String> testEmail(@RequestParam String to) {
        String error = emailService.sendTestEmail(to);
        if (error == null) {
            return Map.of("status", "ok", "message", "Email sent to " + to + " — check your inbox!");
        }
        return Map.of("status", "error", "message", error);
    }
}
