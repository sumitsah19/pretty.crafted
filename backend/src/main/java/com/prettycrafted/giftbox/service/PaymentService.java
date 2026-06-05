package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.exception.PaymentGatewayException;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PaymentService {

    public record RazorpayOrderDetails(String orderId, int amount, String currency) {}

    @Value("${app.razorpay.key-id}")
    private String keyId;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    void init() throws RazorpayException {
        razorpayClient = new RazorpayClient(keyId, keySecret);
    }

    public String createOrder(BigDecimal amountInRupees) {
        try {
            int amountInPaise = amountInRupees.multiply(BigDecimal.valueOf(100)).intValue();
            return createOrder(amountInPaise, "INR", "rcpt_" + System.currentTimeMillis()).orderId();
        } catch (RazorpayException e) {
            if (isAuthFailure(e)) {
                throw new PaymentGatewayException(
                    "razorpay_auth_failed",
                    "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
                    HttpStatus.UNAUTHORIZED,
                    e
                );
            }
            throw new PaymentGatewayException(
                "razorpay_order_failed",
                "Unable to create Razorpay order. Please try again later.",
                HttpStatus.INTERNAL_SERVER_ERROR,
                e
            );
        }
    }

    public RazorpayOrderDetails createOrder(int amountInPaise, String currency, String receipt) throws RazorpayException {
        JSONObject req = new JSONObject();
        req.put("amount", amountInPaise);
        req.put("currency", currency);
        req.put("receipt", receipt);

        com.razorpay.Order order = razorpayClient.orders.create(req);
        return new RazorpayOrderDetails(
            order.get("id"),
            order.get("amount"),
            order.get("currency")
        );
    }

    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (signature == null) return false;
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            // Constant-time comparison to avoid leaking signature bytes via timing.
            return MessageDigest.isEqual(
                hex.toString().getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    public String getKeyId() {
        return keyId;
    }

    public boolean isConfigured() {
        return StringUtils.hasText(keyId)
            && StringUtils.hasText(keySecret)
            && !keyId.contains("placeholder")
            && !keySecret.contains("placeholder");
    }

    public boolean isAuthFailure(RazorpayException e) {
        String message = e.getMessage();
        if (message == null) return false;
        String lower = message.toLowerCase();
        return lower.contains("authentication failed")
            || lower.contains("auth")
            || lower.contains("unauthorized")
            || lower.contains("401")
            || lower.contains("key");
    }
}
