package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.service.OrderService;
import com.prettycrafted.giftbox.service.EmailService;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class RazorpayWebhookController {

    private final OrderRepository orderRepo;
    private final EmailService emailService;
    private final OrderService orderService;

    @Value("${app.razorpay.webhook-secret:}")
    private String webhookSecret;

    /**
     * Razorpay sends webhook events here.
     * Public endpoint — authenticated by HMAC-SHA256 signature on the raw body.
     * Idempotent: checks PaymentStatus before applying changes so replayed events
     * are safe.
     */
    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        if (!verifySignature(rawBody, signature)) {
            log.warn("Razorpay webhook received with invalid signature — rejected");
            return ResponseEntity.status(400).build();
        }

        try {
            JSONObject payload = new JSONObject(rawBody);
            String event = payload.optString("event");
            JSONObject paymentEntity = payload
                    .optJSONObject("payload")
                    .optJSONObject("payment")
                    .optJSONObject("entity");

            if (paymentEntity == null) {
                return ResponseEntity.ok().build();
            }

            String razorpayOrderId = paymentEntity.optString("order_id");
            String razorpayPaymentId = paymentEntity.optString("id");

            Optional<Order> orderOpt = orderRepo.findByRazorpayOrderId(razorpayOrderId);
            if (orderOpt.isEmpty()) {
                log.warn("Webhook event '{}' for unknown Razorpay order '{}'", event, razorpayOrderId);
                return ResponseEntity.ok().build();
            }

            Order order = orderOpt.get();

            switch (event) {
                case "payment.captured" -> {
                    if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
                        log.info("Webhook payment.captured already processed for order {} — skipping", order.getId());
                        return ResponseEntity.ok().build();
                    }
                    try {
                        orderService.applyPostPaymentActions(order, razorpayPaymentId);
                        log.info("Webhook: order {} marked PAID via payment {}", order.getId(), razorpayPaymentId);
                    } catch (Exception e) {
                        log.error("Webhook: failed to apply post-payment actions for order {}: {}", order.getId(),
                                e.getMessage());
                        return ResponseEntity.status(500).build();
                    }
                }
                case "payment.failed" -> {
                    if (order.getPaymentStatus() == PaymentStatus.FAILED) {
                        return ResponseEntity.ok().build();
                    }
                    order.setPaymentStatus(PaymentStatus.FAILED);
                    orderRepo.save(order);
                    log.info("Webhook: order {} marked payment FAILED via payment {}", order.getId(),
                            razorpayPaymentId);
                }
                default -> log.debug("Webhook event '{}' ignored", event);
            }
        } catch (Exception e) {
            log.error("Failed to process Razorpay webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }

        return ResponseEntity.ok().build();
    }

    private boolean verifySignature(String body, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("RAZORPAY_WEBHOOK_SECRET not configured — rejecting webhook requests in production");
            return false;
        }
        if (signature == null || signature.isBlank())
            return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash)
                hex.append(String.format("%02x", b));
            return hex.toString().equals(signature);
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            return false;
        }
    }
}
