package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

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
        sendHtml(user.getEmail(), "Your PrettyCrafted order #" + order.getId(), html);
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
        sendHtml(user.getEmail(), "Payment confirmed for order #" + order.getId(), html);
    }

    @Async
    public void sendVerificationEmail(User user, String token) {
        String verifyUrl = frontendUrl + "/verify-email?token=" + token;
        if (mailUsername == null || mailUsername.isBlank()) {
            log.warn(">>> DEV: Email verification link for {} <<<", user.getEmail());
            log.warn(">>> {}", verifyUrl);
        }
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("verifyUrl", verifyUrl);
        String html = templateEngine.process("email-verification", ctx);
        sendHtml(user.getEmail(), "Verify your PrettyCrafted email address", html);
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        // Always send password-reset emails regardless of emailNotifications preference.
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("token", token);

        String html = templateEngine.process("password-reset", ctx);
        sendHtml(user.getEmail(), "Reset your PrettyCrafted password", html);
    }

    /**
     * Generates a stateless HMAC-SHA256 unsubscribe token so users can
     * opt out via a link without needing to be logged in.
     * Format: /api/auth/unsubscribe?id={userId}&sig={hmac}
     */
    public String buildUnsubscribeUrl(User user) {
        String sig = hmacSha256("unsub:" + user.getId(), jwtSecret);
        return frontendUrl + "/api/auth/unsubscribe?id=" + user.getId() + "&sig=" + sig;
    }

    public boolean verifyUnsubscribeToken(Long userId, String sig) {
        String expected = hmacSha256("unsub:" + userId, jwtSecret);
        return expected.equals(sig);
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

    private void sendHtml(String to, String subject, String html) {
        if (mailUsername == null || mailUsername.isBlank()) {
            // SMTP not configured — log email to console for local development
            log.warn("MAIL_USERNAME not set. Email NOT sent. Dev preview below:");
            log.warn("  TO:      {}", to);
            log.warn("  SUBJECT: {}", subject);
            // Strip tags for a readable console preview
            log.warn("  BODY:    {}", html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim());
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(msg);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
