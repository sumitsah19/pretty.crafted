package com.prettycrafted.giftbox.controller;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.prettycrafted.giftbox.service.PaymentService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RazorpayController {

    private static final int MIN_AMOUNT_PAISE = 100;
    private static final String DEFAULT_CURRENCY = "INR";

    private final PaymentService paymentService;

    @PostMapping("/api/create-order")
    public ResponseEntity<?> createOrder(@Valid @RequestBody CreateOrderRequest req) {
        if (!paymentService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("razorpay_auth_failed", "Razorpay credentials are not configured."));
        }

        String currency = req.currency() == null || req.currency().isBlank()
            ? DEFAULT_CURRENCY
            : req.currency().trim().toUpperCase();
        String receipt = req.receipt() == null || req.receipt().isBlank()
            ? "rcpt_" + System.currentTimeMillis()
            : req.receipt().trim();

        try {
            PaymentService.RazorpayOrderDetails order =
                paymentService.createOrder(req.amount(), currency, receipt);
            return ResponseEntity.ok(new CreateOrderResponse(order.orderId(), order.amount(), order.currency()));
        } catch (RazorpayException e) {
            if (paymentService.isAuthFailure(e)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("razorpay_auth_failed", "Razorpay authentication failed."));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("razorpay_order_failed", "Unable to create Razorpay order."));
        }
    }

    @PostMapping("/api/verify-payment")
    public ResponseEntity<?> verifyPayment(@Valid @RequestBody VerifyPaymentRequest req) {
        boolean valid = paymentService.verifySignature(
            req.razorpayOrderId(),
            req.razorpayPaymentId(),
            req.razorpaySignature()
        );

        if (!valid) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("signature_mismatch", "Payment signature verification failed."));
        }

        return ResponseEntity.ok(new VerifyPaymentResponse(true));
    }

    public record CreateOrderRequest(
        @Min(value = MIN_AMOUNT_PAISE, message = "amount must be at least 100 paise") int amount,
        String currency,
        String receipt
    ) {}

    public record CreateOrderResponse(String order_id, int amount, String currency) {}

    public record VerifyPaymentRequest(
        @JsonProperty("razorpay_payment_id")
        @NotBlank String razorpayPaymentId,
        @JsonProperty("razorpay_order_id")
        @NotBlank String razorpayOrderId,
        @JsonProperty("razorpay_signature")
        @NotBlank String razorpaySignature
    ) {}

    public record VerifyPaymentResponse(boolean success) {}

    public record ErrorResponse(String code, String message) {}
}
