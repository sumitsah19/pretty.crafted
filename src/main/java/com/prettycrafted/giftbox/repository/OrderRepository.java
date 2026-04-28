package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    long countByStatus(OrderStatus status);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o "
        + "where o.paymentStatus = com.prettycrafted.giftbox.domain.PaymentStatus.SUCCESS")
    BigDecimal sumRevenue();
}
