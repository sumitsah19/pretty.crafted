package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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

    @Async
    public void sendOrderConfirmation(Order order) {
        Context ctx = new Context();
        ctx.setVariable("name", order.getUser().getName());
        ctx.setVariable("orderId", order.getId());
        ctx.setVariable("status", order.getStatus().name());
        ctx.setVariable("items", order.getItems());
        ctx.setVariable("total", order.getTotalAmount());
        ctx.setVariable("shippingAddress", order.getShippingAddress());

        String html = templateEngine.process("order-confirmation", ctx);
        sendHtml(order.getUser().getEmail(), "Your PrettyCrafted order #" + order.getId(), html);
    }

    @Async
    public void sendPaymentConfirmation(Order order) {
        Context ctx = new Context();
        ctx.setVariable("name", order.getUser().getName());
        ctx.setVariable("orderId", order.getId());
        ctx.setVariable("status", "PAID");
        ctx.setVariable("items", order.getItems());
        ctx.setVariable("total", order.getTotalAmount());
        ctx.setVariable("shippingAddress", order.getShippingAddress());

        String html = templateEngine.process("order-confirmation", ctx);
        sendHtml(order.getUser().getEmail(), "Payment confirmed for order #" + order.getId(), html);
    }

    @Async
    public void sendPasswordResetEmail(User user, String token) {
        Context ctx = new Context();
        ctx.setVariable("name", user.getName());
        ctx.setVariable("token", token);

        String html = templateEngine.process("password-reset", ctx);
        sendHtml(user.getEmail(), "Reset your PrettyCrafted password", html);
    }

    private void sendHtml(String to, String subject, String html) {
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
