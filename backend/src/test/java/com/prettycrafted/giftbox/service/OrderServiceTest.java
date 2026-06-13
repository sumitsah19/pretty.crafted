package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxItem;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderItem;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.PlaceOrderRequest;
import com.prettycrafted.giftbox.dto.UpdateOrderStatusRequest;
import com.prettycrafted.giftbox.dto.VerifyPaymentRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.PaymentGatewayException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
import com.prettycrafted.giftbox.repository.GiftBoxRepository;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepo;
    @Mock CartItemRepository cartRepo;
    @Mock GiftBoxRepository giftBoxRepo;
    @Mock ProductRepository productRepo;
    @Mock UserRepository userRepo;
    @Mock PaymentService paymentService;
    @Mock EmailService emailService;
    @Mock CouponService couponService;

    @InjectMocks OrderService service;

    private static final User USER = User.builder()
        .id(1L).email("u@example.com").name("Test").role(Role.USER).build();

    private static final PlaceOrderRequest ORDER_REQ =
        new PlaceOrderRequest("123 Main St", "9999999999", "COD", null);

    // ─── Place order ──────────────────────────────────────────────────────────

    @Test
    void place_throwsWhenCartAndBoxesEmpty() {
        when(userRepo.findById(1L)).thenReturn(Optional.of(USER));
        when(cartRepo.findByUserId(1L)).thenReturn(List.of());
        when(giftBoxRepo.findByUserIdAndStatus(1L, GiftBoxStatus.IN_CART)).thenReturn(List.of());

        assertThrows(BadRequestException.class, () -> service.place(1L, ORDER_REQ));
        verify(orderRepo, never()).save(any());
    }

    @Test
    void place_throwsWhenUserNotFound() {
        when(userRepo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.place(99L, ORDER_REQ));
    }

    // ─── Verify payment ───────────────────────────────────────────────────────

    @Test
    void verifyPayment_throwsWhenAlreadyVerified() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.SUCCESS)
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        var req = new VerifyPaymentRequest("rzp_order", "rzp_payment", "sig");
        assertThrows(ConflictException.class, () -> service.verifyPaymentSignature(1L, 10L, req));
    }

    @Test
    void verifyPayment_throwsWhenOrderBelongsToDifferentUser() {
        User other = User.builder().id(2L).email("other@example.com").role(Role.USER).build();
        Order order = Order.builder()
            .id(10L).user(other)
            .paymentStatus(PaymentStatus.PENDING)
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        var req = new VerifyPaymentRequest("rzp_order", "rzp_payment", "sig");
        assertThrows(BadRequestException.class, () -> service.verifyPaymentSignature(1L, 10L, req));
    }

    @Test
    void verifyPayment_throwsOnInvalidSignature() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .razorpayOrderId("rzp_order")
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));
        when(paymentService.verifySignature("rzp_order", "rzp_payment", "badsig")).thenReturn(false);

        var req = new VerifyPaymentRequest("rzp_order", "rzp_payment", "badsig");
        assertThrows(BadRequestException.class, () -> service.verifyPaymentSignature(1L, 10L, req));
        // Order is left PENDING (not FAILED) so the webhook can still resolve it via payment.captured.
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
    }

    // ─── Cancel order ─────────────────────────────────────────────────────────

    private static Product product(long id) {
        return Product.builder().id(id).name("P" + id).build();
    }

    @Test
    void cancel_unpaidRazorpayOrder_doesNotRestoreStock() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .razorpayOrderId("rzp_order")
            .build();
        order.getItems().add(OrderItem.builder()
            .order(order).product(product(5L)).quantity(2).build());
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        service.cancelOrder(1L, 10L);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        // Stock was never decremented (payment never completed) — nothing to restore,
        // and no money was captured — nothing to refund.
        verify(productRepo, never()).incrementStock(anyLong(), anyInt());
        verify(paymentService, never()).refund(any(), any());
    }

    @Test
    void cancel_codOrder_restoresProductAndGiftBoxStock() {
        GiftBox box = GiftBox.builder().id(7L).user(USER).build();
        box.getItems().add(GiftBoxItem.builder().giftBox(box).product(product(5L)).build());
        box.getItems().add(GiftBoxItem.builder().giftBox(box).product(product(6L)).build());

        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .build();
        order.getItems().add(OrderItem.builder()
            .order(order).product(product(5L)).quantity(2).build());
        order.getItems().add(OrderItem.builder()
            .order(order).giftBox(box).quantity(1).build());
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        service.cancelOrder(1L, 10L);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(productRepo).incrementStock(5L, 3); // 2 direct + 1 inside the box
        verify(productRepo).incrementStock(6L, 1);
        verify(paymentService, never()).refund(any(), any()); // COD — nothing captured
    }

    @Test
    void cancel_paidRazorpayOrder_refundsAndRestoresStock() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.SUCCESS)
            .razorpayOrderId("rzp_order")
            .razorpayPaymentId("rzp_payment")
            .totalAmount(new BigDecimal("499.50"))
            .build();
        order.getItems().add(OrderItem.builder()
            .order(order).product(product(5L)).quantity(1).build());
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        service.cancelOrder(1L, 10L);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.REFUNDED, order.getPaymentStatus());
        verify(paymentService).refund("rzp_payment", new BigDecimal("499.50"));
        verify(productRepo).incrementStock(5L, 1);
    }

    @Test
    void cancel_paidRazorpayOrder_refundFailureAbortsCancellation() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.SUCCESS)
            .razorpayOrderId("rzp_order")
            .razorpayPaymentId("rzp_payment")
            .totalAmount(new BigDecimal("499.50"))
            .build();
        order.getItems().add(OrderItem.builder()
            .order(order).product(product(5L)).quantity(1).build());
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));
        when(paymentService.refund("rzp_payment", new BigDecimal("499.50")))
            .thenThrow(new PaymentGatewayException(
                "razorpay_refund_failed", "refund failed", HttpStatus.BAD_GATEWAY, null));

        assertThrows(PaymentGatewayException.class, () -> service.cancelOrder(1L, 10L));

        // Refund failed before any state change — order stays PAID, stock untouched.
        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals(PaymentStatus.SUCCESS, order.getPaymentStatus());
        verify(productRepo, never()).incrementStock(anyLong(), anyInt());
    }

    // ─── Admin status updates ─────────────────────────────────────────────────

    @Test
    void adminCancel_paidOrder_refundsAndRestoresStock() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.SUCCESS)
            .razorpayOrderId("rzp_order")
            .razorpayPaymentId("rzp_payment")
            .totalAmount(new BigDecimal("250.00"))
            .build();
        order.getItems().add(OrderItem.builder()
            .order(order).product(product(5L)).quantity(2).build());
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        service.adminUpdateStatus(10L, new UpdateOrderStatusRequest(OrderStatus.CANCELLED));

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.REFUNDED, order.getPaymentStatus());
        verify(paymentService).refund("rzp_payment", new BigDecimal("250.00"));
        verify(productRepo).incrementStock(5L, 2);
    }

    @Test
    void adminUpdateStatus_cannotLeaveCancelled() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.CANCELLED)
            .paymentStatus(PaymentStatus.REFUNDED)
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        assertThrows(ConflictException.class,
            () -> service.adminUpdateStatus(10L, new UpdateOrderStatusRequest(OrderStatus.PAID)));
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
    }

    @Test
    void adminUpdateStatus_plainTransitionDoesNotTouchStockOrPayments() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PAID)
            .paymentStatus(PaymentStatus.SUCCESS)
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        service.adminUpdateStatus(10L, new UpdateOrderStatusRequest(OrderStatus.SHIPPED));

        assertEquals(OrderStatus.SHIPPED, order.getStatus());
        verify(productRepo, never()).incrementStock(anyLong(), anyInt());
        verify(paymentService, never()).refund(any(), any());
    }

    @Test
    void verifyPayment_throwsWhenRazorpayOrderDoesNotMatch() {
        Order order = Order.builder()
            .id(10L).user(USER)
            .status(OrderStatus.PENDING)
            .paymentStatus(PaymentStatus.PENDING)
            .razorpayOrderId("rzp_order")
            .build();
        when(orderRepo.findById(10L)).thenReturn(Optional.of(order));

        var req = new VerifyPaymentRequest("different_order", "rzp_payment", "sig");
        assertThrows(BadRequestException.class, () -> service.verifyPaymentSignature(1L, 10L, req));
        verify(paymentService, never()).verifySignature(any(), any(), any());
    }
}
