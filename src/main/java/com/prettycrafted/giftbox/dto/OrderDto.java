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
    String shippingAddress,
    String contactPhone,
    String razorpayOrderId,
    List<OrderItemDto> items,
    Instant createdAt
) {
    public static OrderDto from(Order o) {
        return new OrderDto(
            o.getId(),
            o.getStatus(),
            o.getPaymentStatus(),
            o.getTotalAmount(),
            o.getShippingAddress(),
            o.getContactPhone(),
            o.getRazorpayOrderId(),
            o.getItems().stream().map(OrderItemDto::from).toList(),
            o.getCreatedAt()
        );
    }
}
