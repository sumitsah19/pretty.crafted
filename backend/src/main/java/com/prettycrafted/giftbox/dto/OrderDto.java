package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import com.prettycrafted.giftbox.domain.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
    Long id,
    OrderStatus status,
    PaymentStatus paymentStatus,
    BigDecimal totalAmount,
    String couponCode,
    BigDecimal discountAmount,
    BigDecimal deliveryFee,
    String shippingAddress,
    String contactPhone,
    String razorpayOrderId,
    String courier,
    String trackingNumber,
    String trackingUrl,
    List<OrderItemDto> items,
    Instant createdAt,
    String userName,
    String userEmail
) {
    public static OrderDto from(Order o) {
        return new OrderDto(
            o.getId(),
            o.getStatus(),
            o.getPaymentStatus(),
            o.getTotalAmount(),
            o.getCouponCode(),
            o.getDiscountAmount(),
            o.getDeliveryFee(),
            o.getShippingAddress(),
            o.getContactPhone(),
            o.getRazorpayOrderId(),
            o.getCourier(),
            o.getTrackingNumber(),
            o.getTrackingUrl(),
            o.getItems().stream().map(OrderItemDto::from).toList(),
            o.getCreatedAt(),
            o.getUser() != null ? o.getUser().getName() : null,
            o.getUser() != null ? o.getUser().getEmail() : null
        );
    }
}
