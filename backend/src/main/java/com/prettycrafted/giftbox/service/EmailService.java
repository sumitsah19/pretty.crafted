package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.User;
import io.sentry.Sentry;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
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

    @Value("${app.api.url:http://localhost:8080}")
    private String apiUrl;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public EmailService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        this.resendClient = RestClient.create("https://api.resend.com");
    }

    // ── Async senders ──────────────────────────────────────────────────────────

    @Async
    public void sendOrderConfirmation(Order order) {
        sendOrderEmail(order, order.getStatus().name(),
                "Your PrettyCrafted order #" + order.getId(), "order-confirm-" + order.getId());
    }

    @Async
    public void sendPaymentConfirmation(Order order) {
        sendOrderEmail(order, "PAID",
                "Payment confirmed for order #" + order.getId(), "payment-confirm-" + order.getId());
    }

    /**
     * Shared body of the two confirmation emails (identical apart from subject,
     * displayed status and message id): renders the order template, attaches the
     * invoice PDF when it renders, and falls back to HTML-only when it doesn't.
     */
    private void sendOrderEmail(Order order, String displayStatus, String subject, String messageId) {
        User user = order.getUser();
        if (!user.isEmailNotifications())
            return;

        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("orderId", order.getId());
        ctx.setVariable("status", displayStatus);
        ctx.setVariable("items", order.getItems());
        ctx.setVariable("total", order.getTotalAmount());
        ctx.setVariable("shippingAddress", order.getShippingAddress());
        ctx.setVariable("unsubscribeUrl", buildUnsubscribeUrl(user));

        String html = templateEngine.process("order-confirmation", ctx);
        try {
            byte[] pdf = renderHtmlToPdf(html);
            if (pdf != null && pdf.length > 0) {
                List<Map<String, Object>> attachments = new ArrayList<>();
                Map<String, Object> a = new HashMap<>();
                a.put("type", "application/pdf");
                a.put("name", "invoice-" + order.getId() + ".pdf");
                a.put("data", Base64.getEncoder().encodeToString(pdf));
                attachments.add(a);
                sendHtml(user.getEmail(), subject, html, messageId, attachments);
                return;
            }
        } catch (Exception e) {
            log.warn("Invoice PDF generation failed for order {}: {}", order.getId(), e.getMessage());
            Sentry.captureException(e);
        }

        // Fallback: send HTML-only
        sendHtml(user.getEmail(), subject, html, messageId);
    }

    // Render HTML to PDF bytes using OpenHTMLToPDF
    private byte[] renderHtmlToPdf(String html) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            log.error("Failed to render HTML to PDF: {}", e.getMessage());
            return null;
        }
    }

    // ── Synchronous test (used by AdminDashboardController) ───────────────────

    /**
     * Sends a plain test email synchronously.
     * 
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
                    "test-" + System.currentTimeMillis(), null);
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
        return apiUrl + "/api/auth/unsubscribe?id=" + user.getId() + "&sig=" + sig;
    }

    public boolean verifyUnsubscribeToken(Long userId, String sig) {
        String expected = hmacSha256("unsub:" + userId, jwtSecret);
        // Fail closed if the HMAC couldn't be computed (hmacSha256 returns "" on
        // error) — otherwise an empty sig would "match". Constant-time comparison,
        // consistent with the payment/webhook signature checks.
        if (expected.isEmpty() || sig == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                sig.getBytes(StandardCharsets.UTF_8));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Async-safe wrapper: logs in dev mode, captures to Sentry on failure.
     */
    private void sendHtml(String to, String subject, String html, String messageId) {
        sendHtml(to, subject, html, messageId, null);
    }

    private void sendHtml(String to, String subject, String html, String messageId,
            List<Map<String, Object>> attachments) {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not set — email NOT sent. Dev preview:");
            log.warn("  TO:      {}", to);
            log.warn("  SUBJECT: {}", subject);
            log.warn("  BODY:    {}", html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim());
            if (attachments != null && !attachments.isEmpty()) {
                log.warn("  ATTACHMENTS: {} files", attachments.size());
            }
            return;
        }
        try {
            doSend(to, subject, html, messageId, attachments);
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
    private void doSend(String to, String subject, String html, String messageId,
            List<Map<String, Object>> attachments) {
        Map<String, Object> body = new HashMap<>();
        body.put("from", fromAddress);
        body.put("to", List.of(to));
        body.put("subject", subject);
        body.put("html", html);
        body.put("headers", Map.of("X-Message-Id", messageId + "@prettycrafted.com"));
        if (attachments != null && !attachments.isEmpty()) {
            body.put("attachments", attachments);
        }
        try {
            resendClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpStatusCodeException e) {
            // Surface Resend's own error body (e.g. "Invalid API key", "Domain not
            // verified")
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
