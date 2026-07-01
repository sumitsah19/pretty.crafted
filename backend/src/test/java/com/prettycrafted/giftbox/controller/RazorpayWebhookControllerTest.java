package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.service.EmailService;
import com.prettycrafted.giftbox.service.OrderService;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RazorpayWebhookControllerTest {

    private static final String SECRET = "test-webhook-secret";

    @Mock OrderRepository orderRepo;
    @Mock EmailService emailService;
    @Mock OrderService orderService;

    RazorpayWebhookController controller;

    @BeforeEach
    void setUp() {
        controller = new RazorpayWebhookController(orderRepo, emailService, orderService);
        ReflectionTestUtils.setField(controller, "webhookSecret", SECRET);
    }

    private static String sign(String body, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    private static String capturedPayload(String razorpayOrderId, String razorpayPaymentId) {
        return "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{"
            + "\"id\":\"" + razorpayPaymentId + "\",\"order_id\":\"" + razorpayOrderId + "\"}}}}";
    }

    private static Order order(Long id, String razorpayOrderId, OrderStatus status, PaymentStatus paymentStatus) {
        return Order.builder().id(id).razorpayOrderId(razorpayOrderId).status(status).paymentStatus(paymentStatus).build();
    }

    // ─── payment.captured, but fulfillment fails ─────────────────────────────

    @Test
    void fulfillmentFailure_cancelsAndRefundsInline_returnsOk() throws Exception {
        String body = capturedPayload("order_abc", "pay_123");
        String sig = sign(body, SECRET);
        Order ord = order(10L, "order_abc", OrderStatus.PENDING, PaymentStatus.PENDING);
        when(orderRepo.findByRazorpayOrderId("order_abc")).thenReturn(Optional.of(ord));
        doThrow(new RuntimeException("out of stock")).when(orderService).applyPostPaymentActions(10L, "pay_123");
        when(orderService.refundCapturedPaymentForCancelledOrder(10L, "pay_123")).thenReturn(true);

        ResponseEntity<Void> resp = controller.handleWebhook(body, sig);

        assertEquals(200, resp.getStatusCode().value());
        verify(orderService).markOrderCancelled(10L);
        verify(orderService).refundCapturedPaymentForCancelledOrder(10L, "pay_123");
    }

    @Test
    void fulfillmentFailure_refundAlsoFails_returns500SoRazorpayRetries() throws Exception {
        String body = capturedPayload("order_abc", "pay_123");
        String sig = sign(body, SECRET);
        Order ord = order(10L, "order_abc", OrderStatus.PENDING, PaymentStatus.PENDING);
        when(orderRepo.findByRazorpayOrderId("order_abc")).thenReturn(Optional.of(ord));
        doThrow(new RuntimeException("out of stock")).when(orderService).applyPostPaymentActions(10L, "pay_123");
        doThrow(new RuntimeException("gateway down")).when(orderService).refundCapturedPaymentForCancelledOrder(10L, "pay_123");

        ResponseEntity<Void> resp = controller.handleWebhook(body, sig);

        assertEquals(500, resp.getStatusCode().value());
        verify(orderService).markOrderCancelled(10L);
    }

    @Test
    void fulfillmentSucceeds_noRefundAttempted() throws Exception {
        String body = capturedPayload("order_abc", "pay_123");
        String sig = sign(body, SECRET);
        Order ord = order(10L, "order_abc", OrderStatus.PENDING, PaymentStatus.PENDING);
        when(orderRepo.findByRazorpayOrderId("order_abc")).thenReturn(Optional.of(ord));

        ResponseEntity<Void> resp = controller.handleWebhook(body, sig);

        assertEquals(200, resp.getStatusCode().value());
        verify(orderService, never()).markOrderCancelled(any());
        verify(orderService, never()).refundCapturedPaymentForCancelledOrder(any(), any());
    }

    // ─── Money already captured against an order the user cancelled first ───

    @Test
    void paymentCapturedForAlreadyCancelledOrder_refundsWithoutTouchingFulfillment() throws Exception {
        String body = capturedPayload("order_abc", "pay_123");
        String sig = sign(body, SECRET);
        Order ord = order(10L, "order_abc", OrderStatus.CANCELLED, PaymentStatus.PENDING);
        when(orderRepo.findByRazorpayOrderId("order_abc")).thenReturn(Optional.of(ord));
        when(orderService.refundCapturedPaymentForCancelledOrder(10L, "pay_123")).thenReturn(true);

        ResponseEntity<Void> resp = controller.handleWebhook(body, sig);

        assertEquals(200, resp.getStatusCode().value());
        verify(orderService, never()).applyPostPaymentActions(any(), any());
        verify(orderService).refundCapturedPaymentForCancelledOrder(10L, "pay_123");
    }

    // ─── Signature / idempotency ─────────────────────────────────────────────

    @Test
    void invalidSignature_rejectedWithoutTouchingOrder() {
        String body = capturedPayload("order_abc", "pay_123");

        ResponseEntity<Void> resp = controller.handleWebhook(body, "wrong-signature");

        assertEquals(400, resp.getStatusCode().value());
        verifyNoInteractions(orderRepo, orderService);
    }

    @Test
    void alreadySuccessfulPayment_skipsReprocessing() throws Exception {
        String body = capturedPayload("order_abc", "pay_123");
        String sig = sign(body, SECRET);
        Order ord = order(10L, "order_abc", OrderStatus.PAID, PaymentStatus.SUCCESS);
        when(orderRepo.findByRazorpayOrderId("order_abc")).thenReturn(Optional.of(ord));

        ResponseEntity<Void> resp = controller.handleWebhook(body, sig);

        assertEquals(200, resp.getStatusCode().value());
        verify(orderService, never()).applyPostPaymentActions(any(), any());
    }
}
