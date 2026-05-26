package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.PlaceOrderRequest;
import com.prettycrafted.giftbox.dto.VerifyPaymentRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
import com.prettycrafted.giftbox.repository.GiftBoxRepository;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
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

    @InjectMocks OrderService service;

    private static final User USER = User.builder()
        .id(1L).email("u@example.com").name("Test").role(Role.USER).build();

    private static final PlaceOrderRequest ORDER_REQ =
        new PlaceOrderRequest("123 Main St", "9999999999", "COD");

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
        assertThrows(ConflictException.class, () -> service.verifyPayment(1L, 10L, req));
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
        assertThrows(BadRequestException.class, () -> service.verifyPayment(1L, 10L, req));
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
        assertThrows(BadRequestException.class, () -> service.verifyPayment(1L, 10L, req));
        assertEquals(PaymentStatus.FAILED, order.getPaymentStatus());
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
        assertThrows(BadRequestException.class, () -> service.verifyPayment(1L, 10L, req));
        verify(paymentService, never()).verifySignature(any(), any(), any());
    }
}
