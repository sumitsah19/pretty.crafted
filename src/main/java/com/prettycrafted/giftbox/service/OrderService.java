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
        for (Map.Entry<Long, Integer> e : stockNeeded.entrySet()) {
            Product p = productRepo.findById(e.getKey())
                .orElseThrow(() -> new NotFoundException("Product not found: " + e.getKey()));
            if (p.getStock() < e.getValue()) {
                throw new ConflictException("Out of stock: " + p.getName());
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
            box.setStatus(GiftBoxStatus.ORDERED);
        }

        for (Map.Entry<Long, Integer> e : stockNeeded.entrySet()) {
            Product p = productRepo.findById(e.getKey()).orElseThrow();
            p.setStock(p.getStock() - e.getValue());
            p.setPopularityScore(p.getPopularityScore() + e.getValue());
        }

        order.setTotalAmount(total);
        cartRepo.deleteByUserId(userId);

        String rzpOrderId = paymentService.createOrder(total);
        order.setRazorpayOrderId(rzpOrderId);

        emailService.sendOrderConfirmation(order);
        return new PlaceOrderResponse(OrderDto.from(order), paymentService.getKeyId());
    }

    public OrderDto verifyPayment(Long userId, Long orderId, VerifyPaymentRequest req) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Order does not belong to user");
        }
        if (order.getPaymentStatus() == PaymentStatus.SUCCESS) {
            throw new ConflictException("Payment already verified");
        }
        if (!paymentService.verifySignature(req.razorpayOrderId(), req.razorpayPaymentId(), req.razorpaySignature())) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            throw new BadRequestException("Invalid payment signature");
        }
        order.setRazorpayPaymentId(req.razorpayPaymentId());
        order.setPaymentStatus(PaymentStatus.SUCCESS);
        order.setStatus(OrderStatus.PAID);
        emailService.sendPaymentConfirmation(order);
        return OrderDto.from(order);
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
            throw new BadRequestException("Cannot cancel order that is already " + order.getStatus().name().toLowerCase());
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Order is already cancelled");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return OrderDto.from(order);
    }

    // --- Admin methods ---

    @Transactional(readOnly = true)
    public Page<OrderDto> adminListOrders(OrderStatus status, Pageable pageable) {
        if (status != null) {
            return orderRepo.findByStatus(status, pageable).map(OrderDto::from);
        }
        return orderRepo.findAll(pageable).map(OrderDto::from);
    }

    public OrderDto adminUpdateStatus(Long orderId, UpdateOrderStatusRequest req) {
        Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        order.setStatus(req.status());
        return OrderDto.from(order);
    }
}
