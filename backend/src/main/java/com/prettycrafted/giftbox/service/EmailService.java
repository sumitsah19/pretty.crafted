package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.User;
import io.sentry.Sentry;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
public class EmailService {

    private final TemplateEngine templateEngine;
    private final RestClient resendClient;

    @Value("${app.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.mail.from:support@prettycrafted.com}")
    private String fromAddress;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public EmailService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        this.resendClient = RestClient.create("https://api.resend.com");
    }

    // ── Async senders ──────────────────────────────────────────────────────────

    @Async
    public void sendOrderConfirmation(Order order) {
        User user = order.getUser();
        if (!user.isEmailNotifications()) return;

        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("orderId", order.getId());
        ctx.setVariable("status", order.getStatus().name());
        ctx.setVariable("items", order.getItems());
        ctx.setVariable("total", order.getTotalAmount());
        ctx.setVariable("shippingAddress", order.getShippingAddress());
        ctx.setVariable("unsubscribeUrl", buildUnsubscribeUrl(user));

        String html = templateEngine.process("order-confirmation", ctx);
        sendHtml(user.getEmail(), "Your PrettyCrafted order #" + order.getId(), html,
            "order-confirm-" + order.getId());
    }

    @Async
    public void sendPaymentConfirmation(Order order) {
        User user = order.getUser();
        if (!user.isEmailNotifications()) return;

        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("orderId", order.getId());
        ctx.setVariable("status", "PAID");
        ctx.setVariable("items", order.getItems());
        ctx.setVariable("total", order.getTotalAmount());
        ctx.setVariable("shippingAddress", order.getShippingAddress());
        ctx.setVariable("unsubscribeUrl", buildUnsubscribeUrl(user));

        String html = templateEngine.process("order-confirmation", ctx);
        sendHtml(user.getEmail(), "Payment confirmed for order #" + order.getId(), html,
            "payment-confirm-" + order.getId());
    }

    @Async
    public void sendVerificationEmail(User user, String token) {
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn(">>> DEV: Email verification link for {} <<<", user.getEmail());
            log.warn(">>> {}", verifyUrl);
        }
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("verifyUrl", verifyUrl);
        String html = templateEngine.process("email-verification", ctx);
        sendHtml(user.getEmail(), "Verify your PrettyCrafted email address", html,
            "verify-" + user.getId() + "-" + token.substring(0, 8));
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        // Always sent regardless of emailNotifications preference.
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn(">>> DEV: Password reset link for {} <<<", user.getEmail());
            log.warn(">>> {}", resetUrl);
        }
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("token", token);
        ctx.setVariable("resetUrl", resetUrl);
        String html = templateEngine.process("password-reset", ctx);
        sendHtml(user.getEmail(), "Reset your Pretty.Crafted password", html,
            "reset-" + user.getId() + "-" + token.substring(0, 8));
    }

    @Async
    public void sendOtpEmail(User user, String otp) {
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("otp", otp);
        String html = templateEngine.process("otp-email", ctx);
        sendHtml(user.getEmail(), "Your PrettyCrafted login code: " + otp, html,
            "otp-" + user.getId() + "-" + otp);
    }

    // ── Synchronous test (used by AdminDashboardController) ───────────────────

    /**
     * Sends a plain test email synchronously.
     * @return null on success, error message string on failure.
     */
    public String sendTestEmail(String to) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            return "RESEND_API_KEY is not set — add it to Railway environment variables.";
        }
        try {
            doSend(to,
                "Pretty.Crafted — Email test ✓",
                "<p>This is a test email from your Pretty.Crafted backend via <strong>Resend API</strong>.</p>" +
                "<p><strong>Email delivery is working correctly!</strong></p>" +
                "<p>From: " + fromAddress + "</p>",
                "test-" + System.currentTimeMillis());
            return null; // success
        } catch (Exception e) {
            return e.getMessage();
        }
    }

    // ── Unsubscribe helpers ───────────────────────────────────────────────────

    /**
     * Stateless HMAC-SHA256 unsubscribe token so users can opt out via email link
     * without being logged in. Format: /api/auth/unsubscribe?id={userId}&sig={hmac}
     */
    public String buildUnsubscribeUrl(User user) {
        String sig = hmacSha256("unsub:" + user.getId(), jwtSecret);
        return frontendUrl + "/api/auth/unsubscribe?id=" + user.getId() + "&sig=" + sig;
    }

    public boolean verifyUnsubscribeToken(Long userId, String sig) {
        String expected = hmacSha256("unsub:" + userId, jwtSecret);
        return expected.equals(sig);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Async-safe wrapper: logs in dev mode, captures to Sentry on failure.
     */
    private void sendHtml(String to, String subject, String html, String messageId) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — email NOT sent. Dev preview:");
            log.warn("  TO:      {}", to);
            log.warn("  SUBJECT: {}", subject);
            log.warn("  BODY:    {}", html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim());
            return;
        }
        try {
            doSend(to, subject, html, messageId);
            log.info("Email sent via Resend: subject='{}' to='{}'", subject, to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            Sentry.captureException(e);
        }
    }

    /**
     * Calls the Resend POST /emails endpoint.
     * Throws on any non-2xx response — caller decides how to handle.
     */
    private void doSend(String to, String subject, String html, String messageId) {
        Map<String, Object> body = Map.of(
            "from", fromAddress,
            "to", List.of(to),
            "subject", subject,
            "html", html,
            "headers", Map.of("X-Message-Id", messageId + "@prettycrafted.com")
        );
        try {
            resendClient.post()
                .uri("/emails")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (HttpStatusCodeException e) {
            // Surface Resend's own error body (e.g. "Invalid API key", "Domain not verified")
            throw new RuntimeException(
                "Resend API " + e.getStatusCode() + ": " + e.getResponseBodyAsString(), e);
        }
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Failed to generate HMAC: {}", e.getMessage());
            return "";
        }
    }
}
