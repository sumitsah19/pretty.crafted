package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.service.PaymentService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
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

    public record CreateOrderRequest(
        @Min(value = MIN_AMOUNT_PAISE, message = "amount must be at least 100 paise") int amount,
        String currency,
        String receipt
    ) {}

    public record CreateOrderResponse(String order_id, long amount, String currency) {}

    public record ErrorResponse(String code, String message) {}
}
