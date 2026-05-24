package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.DashboardStatsDto;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.UpdateStockRequest;
import com.prettycrafted.giftbox.service.AdminService;
import jakarta.mail.internet.MimeMessage;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:support@prettycrafted.com}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @GetMapping("/stats")
    public DashboardStatsDto stats() {
        return service.getStats();
    }

    @PatchMapping("/products/{id}/stock")
    public ProductDto updateStock(@PathVariable Long id,
                                  @Valid @RequestBody UpdateStockRequest req) {
        return service.updateStock(id, req);
    }

    /**
     * Synchronous SMTP test — call this to diagnose email delivery issues.
     * Usage: GET /api/admin/test-email?to=your@email.com
     * Returns {"status":"ok"} or {"status":"error","message":"exact error"}
     */
    @GetMapping("/test-email")
    public Map<String, String> testEmail(@RequestParam String to) {
        if (mailUsername == null || mailUsername.isBlank()) {
            return Map.of("status", "error", "message",
                "MAIL_USERNAME is not set. Add it to Railway environment variables.");
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject("Pretty.Crafted — SMTP test ✓");
            helper.setText(
                "This is a test email from your Pretty.Crafted backend.\n\n" +
                "SMTP is working correctly!\n\n" +
                "From: " + fromAddress + "\nTo: " + to, false);
            mailSender.send(msg);
            return Map.of("status", "ok", "message", "Email sent to " + to + " — check your inbox!");
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}
