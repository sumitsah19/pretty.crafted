package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.CartItem;
import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxItem;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderItem;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.OrderDto;
import com.prettycrafted.giftbox.dto.PlaceOrderRequest;
import com.prettycrafted.giftbox.dto.PlaceOrderResponse;
import com.prettycrafted.giftbox.dto.UpdateOrderStatusRequest;
import com.prettycrafted.giftbox.dto.UpdateTrackingRequest;
import com.prettycrafted.giftbox.dto.VerifyPaymentRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
import com.prettycrafted.giftbox.repository.GiftBoxRepository;
import com.prettycrafted.giftbox.repository.OrderRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {
    private final OrderRepository orderRepo;
    private final CartItemRepository cartRepo;
    private final GiftBoxRepository giftBoxRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final CouponService couponService;

    public PlaceOrderResponse place(Long userId, PlaceOrderRequest req) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));

        List<CartItem> cartItems = cartRepo.findByUserId(userId);
        List<GiftBox> boxes = giftBoxRepo.findByUserIdAndStatus(userId, GiftBoxStatus.IN_CART);

        if (cartItems.isEmpty() && boxes.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        Map<Long, Integer> stockNeeded = new HashMap<>();
        for (CartItem ci : cartItems) {
            stockNeeded.merge(ci.getProduct().getId(), ci.getQuantity(), Integer::sum);
        }
        for (GiftBox box : boxes) {
            for (GiftBoxItem gi : box.getItems()) {
                stockNeeded.merge(gi.getProduct().getId(), 1, Integer::sum);
            }
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .shippingAddress(req.shippingAddress().trim())
                .contactPhone(req.contactPhone().trim())
                .build();
        order = orderRepo.save(order);

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem ci : cartItems) {
            Product p = ci.getProduct();
            BigDecimal unit = p.getPrice();
            BigDecimal line = unit.multiply(BigDecimal.valueOf(ci.getQuantity()));
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .product(p)
                    .itemName(p.getName())
                    .quantity(ci.getQuantity())
                    .unitPrice(unit)
                    .lineTotal(line)
                    .build());
            total = total.add(line);
        }

        for (GiftBox box : boxes) {
            String name = box.getSize().name() + " Gift Box (" + box.getItems().size() + " items)";
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .giftBox(box)
                    .itemName(name)
                    .quantity(1)
                    .unitPrice(box.getTotalPrice())
                    .lineTotal(box.getTotalPrice())
                    .build());
            total = total.add(box.getTotalPrice());
        }

        // For online payments (Razorpay) we DO NOT decrement stock or clear the cart
        // here.
        // We still verify availability to fail fast, but actual stock decrement and
        // cart
        // clearing happens only after payment is verified (see verifyPayment and
        // webhook).
        boolean isRazorpay = "RAZORPAY".equalsIgnoreCase(req.paymentMethod());

        if (isRazorpay) {
            for (Map.Entry<Long, Integer> e : stockNeeded.entrySet()) {
                Product p = productRepo.findById(e.getKey())
                        .orElseThrow(() -> new NotFoundException("Product not found: " + e.getKey()));
                if (p.getStock() < e.getValue()) {
                    throw new ConflictException("Out of stock: " + p.getName());
                }
            }
        } else {
            // COD or other non-online payments: decrement stock and clear the cart
            // immediately
            for (Map.Entry<Long, Integer> e : stockNeeded.entrySet()) {
                int updated = productRepo.decrementStock(e.getKey(), e.getValue());
                if (updated == 0) {
                    Product p = productRepo.findById(e.getKey())
                            .orElseThrow(() -> new NotFoundException("Product not found: " + e.getKey()));
                    throw new ConflictException("Out of stock: " + p.getName());
                }
            }
            cartRepo.deleteByUserId(userId);
            // mark gift boxes ordered for non-online flows
            for (GiftBox box : boxes) {
                box.setStatus(GiftBoxStatus.ORDERED);
            }
        }

        // Apply the coupon last, on the full subtotal, before the amount is sent
        // to Razorpay. For COD the order is final now, so the use is consumed in
        // this same transaction (a failed placement rolls it back). For Razorpay
        // the order is still unpaid and may be abandoned, so we only validate and
        // lock in the discount here — the use is consumed at payment confirmation
        // (applyPostPaymentActions), so abandoned online orders never burn a use.
        if (req.couponCode() != null && !req.couponCode().isBlank()) {
            String code = req.couponCode().trim().toUpperCase();
            BigDecimal discount = isRazorpay
                    ? couponService.previewDiscount(code, total)
                    : couponService.redeem(code, total);
            order.setCouponCode(code);
            order.setDiscountAmount(discount);
            total = total.subtract(discount);
        }

        order.setTotalAmount(total);

        String rzpOrderId = null;
        if (isRazorpay) {
            // Razorpay rejects orders below its ₹1.00 (100 paise) minimum, which a
            // deep discount (e.g. a 100%-off coupon) can produce. Fail fast with
            // clear guidance instead of surfacing an opaque gateway error — a free
            // or near-free order can still be placed as Cash on Delivery.
            if (total.compareTo(BigDecimal.ONE) < 0) {
                throw new BadRequestException(
                        "This order total is below the ₹1 minimum for online payment. Please choose Cash on Delivery.");
            }
            rzpOrderId = paymentService.createOrder(total);
            order.setRazorpayOrderId(rzpOrderId);
        }

        Order savedOrder = order;
        // Send order confirmation immediately only for non-online payments.
        if (!isRazorpay) {
            TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            emailService.sendOrderConfirmation(savedOrder);
                        }
                    });
        }

        return new PlaceOrderResponse(OrderDto.from(order), paymentService.getKeyId());
    }

    /**
     * Validates ownership, order-id match and the Razorpay signature, and records
     * the
     * payment id. Runs in its own transaction so the caller (OrderController) can
     * then
     * invoke applyPostPaymentActions / markOrderCancelled in separate transactions
     * —
     * mirroring the webhook flow so an out-of-stock failure AFTER a successful
     * payment
     * still persists a CANCELLED order instead of silently rolling back.
     */
    public void verifyPaymentSignature(Long userId, Long orderId, VerifyPaymentRequest req) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new ConflictException("Payment already verified");
        }
        if (order.getRazorpayOrderId() == null) {
            throw new BadRequestException("Order was not created for Razorpay payment");
        }
        if (!order.getRazorpayOrderId().equals(req.razorpayOrderId())) {
            throw new BadRequestException("Payment order id does not match this order");
        }
        if (!paymentService.verifySignature(req.razorpayOrderId(), req.razorpayPaymentId(), req.razorpaySignature())) {
            throw new BadRequestException("Invalid payment signature");
        }
        order.setRazorpayPaymentId(req.razorpayPaymentId());
    }

    /**
     * Apply post-payment changes: decrement stock, mark gift boxes, clear cart,
     * set payment/order status and send payment confirmation email.
     * Loads the order by ID so it always runs within its own transaction boundary,
     * keeping the webhook handler free of shared transaction state.
     */
    public void applyPostPaymentActions(Long orderId, String razorpayPaymentId) {
        Order order = orderRepo.findByIdWithLock(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return;
        }

        // Attempt to decrement stock and clear the cart now that payment is verified.
        for (Map.Entry<Long, Integer> e : stockByProduct(order).entrySet()) {
            int updated = productRepo.decrementStock(e.getKey(), e.getValue());
            if (updated == 0) {
                // Do NOT save here — this transaction will roll back when we throw.
                // The caller is responsible for persisting the CANCELLED state in a
                // separate transaction (see markOrderCancelled).
                throw new ConflictException("Payment verified but items are out of stock. Please contact support.");
            }
        }

        // mark gift boxes ordered and clear the user's cart
        for (OrderItem item : order.getItems()) {
            if (item.getGiftBox() != null) {
                GiftBox box = item.getGiftBox();
                box.setStatus(GiftBoxStatus.ORDERED);
            }
        }
        cartRepo.deleteByUserId(order.getUser().getId());

        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(OrderStatus.PAID);
        order.setRazorpayPaymentId(razorpayPaymentId);

        // Consume the coupon now that payment is confirmed — deferred from
        // placement so an abandoned online order never burns a use. The early
        // return above (already SUCCESS) keeps this from double-counting on a
        // retried verify/webhook.
        couponService.consume(order.getCouponCode());

        orderRepo.save(order);

        Order confirmedOrder = order;
        TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        emailService.sendPaymentConfirmation(confirmedOrder);
                    }
                });
    }

    /**
     * A payment was captured for an order that is already CANCELLED (typically a
     * late capture after the user cancelled an unpaid online order). The order
     * must not be fulfilled, so the money is refunded automatically. Idempotent:
     * returns quietly if the order is no longer cancelled or was already refunded.
     *
     * @return true if a refund was issued
     */
    public boolean refundCapturedPaymentForCancelledOrder(Long orderId, String razorpayPaymentId) {
        Order order = orderRepo.findByIdWithLock(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (order.getStatus() != OrderStatus.CANCELLED
                || order.getPaymentStatus() == PaymentStatus.REFUNDED) {
            return false;
        }
        paymentService.refund(razorpayPaymentId, order.getTotalAmount());
        order.setRazorpayPaymentId(razorpayPaymentId);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        orderRepo.save(order);
        return true;
    }

    /**
     * Persists FAILED/CANCELLED in its own transaction — safe to call after a
     * rolled-back applyPostPaymentActions.
     */
    public void markOrderCancelled(Long orderId) {
        orderRepo.findById(orderId).ifPresent(order -> {
            order.setPaymentStatus(PaymentStatus.FAILED);
            order.setStatus(OrderStatus.CANCELLED);
            orderRepo.save(order);
        });
    }

    /**
     * Cancels abandoned unpaid Razorpay orders (dismissed payment popups) older
     * than the cutoff. Each is locked and re-checked so a payment that lands via
     * webhook in the meantime is never clobbered. Returns the number cancelled.
     */
    public int cancelAbandonedRazorpayOrders(java.time.Instant cutoff) {
        int cancelled = 0;
        for (Order stale : orderRepo.findAbandonedRazorpayOrders(cutoff)) {
            Order order = orderRepo.findByIdWithLock(stale.getId()).orElse(null);
            if (order != null
                    && order.getStatus() == OrderStatus.PENDING
                    && order.getPaymentStatus() == PaymentStatus.PENDING) {
                order.setStatus(OrderStatus.CANCELLED);
                order.setPaymentStatus(PaymentStatus.FAILED);
                orderRepo.save(order);
                cancelled++;
            }
        }
        return cancelled;
    }

    @Transactional(readOnly = true)
    public Page<OrderDto> myOrders(Long userId, Pageable pageable) {
        return orderRepo.findByUserId(userId, pageable).map(OrderDto::from);
    }

    @Transactional(readOnly = true)
    public OrderDto get(Long userId, Long orderId) {
        Order o = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!o.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        return OrderDto.from(o);
    }

    public OrderDto cancelOrder(Long userId, Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException(
                    "Cannot cancel order that is already " + order.getStatus().name().toLowerCase());
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Order is already cancelled");
        }
        applyCancellation(order);
        return OrderDto.from(order);
    }

    /**
     * Cancels an order with full money/inventory bookkeeping. Shared by the
     * user-facing {@link #cancelOrder} and the admin status update so both
     * paths refund and restock identically.
     */
    private void applyCancellation(Order order) {
        // Refund a captured Razorpay payment BEFORE mutating any state: if the
        // gateway call fails, the PaymentGatewayException aborts the whole
        // cancellation, leaving the order PAID. The reverse ordering could
        // cancel the order while keeping the customer's money.
        boolean paymentCaptured = order.getPaymentStatus() == PaymentStatus.SUCCESS;
        if (paymentCaptured && order.getRazorpayPaymentId() != null) {
            paymentService.refund(order.getRazorpayPaymentId(), order.getTotalAmount());
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        order.setStatus(OrderStatus.CANCELLED);

        // Restore stock only if it was actually taken: COD orders decrement at
        // placement, Razorpay orders only after a successful payment (see
        // applyPostPaymentActions). Cancelling an unpaid online order must not
        // add back stock that was never removed.
        boolean stockWasTaken = order.getRazorpayOrderId() == null || paymentCaptured;
        if (stockWasTaken) {
            for (Map.Entry<Long, Integer> e : stockByProduct(order).entrySet()) {
                productRepo.incrementStock(e.getKey(), e.getValue());
            }
        }
    }

    /**
     * Per-product stock footprint of an order: direct product line items plus the
     * contents of any gift boxes (one unit per box item). Must stay in sync with
     * the availability check in {@link #place}.
     */
    private static Map<Long, Integer> stockByProduct(Order order) {
        Map<Long, Integer> stock = new HashMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                stock.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
            } else if (item.getGiftBox() != null) {
                for (GiftBoxItem gi : item.getGiftBox().getItems()) {
                    stock.merge(gi.getProduct().getId(), 1, Integer::sum);
                }
            }
        }
        return stock;
    }

    // --- Admin methods ---

    @Transactional(readOnly = true)
    public Page<OrderDto> adminListOrders(OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepo.findByStatus(status, pageable).map(OrderDto::from);
        }
        return orderRepo.findAll(pageable).map(OrderDto::from);
    }

    public OrderDto adminUpdateTracking(Long orderId, UpdateTrackingRequest req) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        order.setCourier(trimToNull(req.courier()));
        order.setTrackingNumber(trimToNull(req.trackingNumber()));
        order.setTrackingUrl(trimToNull(req.trackingUrl()));
        return OrderDto.from(order);
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public OrderDto adminUpdateStatus(Long orderId, UpdateOrderStatusRequest req) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        OrderStatus next = req.status();
        if (order.getStatus() == next) {
            return OrderDto.from(order);
        }
        // Cancellation already refunded and restocked — reviving the order would
        // leave money and inventory out of sync. It stays cancelled.
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Order is cancelled and its status can no longer change");
        }
        if (next == OrderStatus.CANCELLED) {
            // Same bookkeeping as a user cancellation: refund captured payments,
            // restore stock that was actually taken.
            applyCancellation(order);
        } else {
            order.setStatus(next);
        }
        return OrderDto.from(order);
    }
}
