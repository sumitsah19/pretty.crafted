package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    long countByStatus(OrderStatus status);
    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") Long id);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o "
        + "where o.paymentStatus = com.prettycrafted.giftbox.domain.PaymentStatus.SUCCESS")
    BigDecimal sumRevenue();

    @Query("select o.user.id, count(o), coalesce(sum(o.totalAmount), 0) from Order o "
        + "where o.paymentStatus = com.prettycrafted.giftbox.domain.PaymentStatus.SUCCESS "
        + "group by o.user.id")
    List<Object[]> findUserOrderStats();
}
