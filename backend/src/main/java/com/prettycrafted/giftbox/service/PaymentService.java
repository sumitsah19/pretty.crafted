package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.exception.PaymentGatewayException;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
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

    public record RazorpayOrderDetails(String orderId, long amount, String currency) {}

    @Value("${app.razorpay.key-id}")
    private String keyId;

    @Value("${app.razorpay.key-secret}")
    private String keySecret;

    private RazorpayClient razorpayClient;

    @PostConstruct
    void init() throws RazorpayException {
        // Don't construct the client (or crash startup) when keys are missing or
        // placeholders — local/dev environments run fine without Razorpay. Calls
        // that actually need the gateway fail clearly via requireClient().
        if (isConfigured()) {
            razorpayClient = new RazorpayClient(keyId, keySecret);
        }
    }

    private RazorpayClient requireClient() {
        if (razorpayClient == null) {
            throw new PaymentGatewayException(
                "razorpay_not_configured",
                "Online payments are not available right now. Please choose Cash on Delivery.",
                HttpStatus.SERVICE_UNAVAILABLE,
                null
            );
        }
        return razorpayClient;
    }

    public String createOrder(BigDecimal amountInRupees) {
        try {
            // Round to paise (HALF_UP) and use a long — never truncate via intValue()
            // (₹10.999 → 1100p, not 1099p) and never overflow on large totals.
            long amountInPaise = amountInRupees
                .setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
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

    public RazorpayOrderDetails createOrder(long amountInPaise, String currency, String receipt) throws RazorpayException {
        JSONObject req = new JSONObject();
        req.put("amount", amountInPaise);
        req.put("currency", currency);
        req.put("receipt", receipt);

        com.razorpay.Order order = requireClient().orders.create(req);
        return new RazorpayOrderDetails(
            order.get("id"),
            ((Number) order.get("amount")).longValue(),
            order.get("currency")
        );
    }

    /**
     * Refunds a captured payment in full. Amount is in rupees; converted to paise
     * with rounding (HALF_UP) — never truncation — so ₹499.999 refunds 50000p,
     * not 49999p.
     *
     * @return the Razorpay refund id
     */
    public String refund(String razorpayPaymentId, BigDecimal amountInRupees) {
        long amountInPaise = amountInRupees
                .setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
        try {
            JSONObject req = new JSONObject();
            req.put("amount", amountInPaise);
            com.razorpay.Refund refund = requireClient().payments.refund(razorpayPaymentId, req);
            return refund.get("id");
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
                "razorpay_refund_failed",
                "Unable to refund this payment right now. Please try again or contact support.",
                HttpStatus.BAD_GATEWAY,
                e
            );
        }
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
        // Match only unambiguous credential-failure phrasings. Bare substrings
        // like "auth" or "key" would misclassify unrelated gateway errors (e.g.
        // "order id key missing") as a 401 credential problem.
        return lower.contains("authentication failed")
            || lower.contains("unauthorized")
            || lower.contains("401");
    }
}
