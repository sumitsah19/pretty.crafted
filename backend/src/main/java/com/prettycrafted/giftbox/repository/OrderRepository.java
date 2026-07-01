package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Order;
import com.prettycrafted.giftbox.domain.OrderStatus;
import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.Collection;
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

    /**
     * Admin search by order id, customer name, or email — matches the whole
     * result set server-side rather than whatever page is currently loaded in
     * the admin UI (see AdminOrderController). {@code q} is matched as-is;
     * callers are responsible for trimming/lower-casing as needed.
     */
    @Query("select o from Order o where "
        + "(:status is null or o.status = :status) and "
        + "(str(o.id) like concat('%', :q, '%') "
        + " or lower(o.user.name) like lower(concat('%', :q, '%')) "
        + " or lower(o.user.email) like lower(concat('%', :q, '%')))")
    Page<Order> search(@Param("status") OrderStatus status, @Param("q") String q, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdWithLock(@Param("id") Long id);

    /**
     * Unpaid online orders left behind by dismissed Razorpay popups or hard
     * payment failures. The order is still PENDING (payment never succeeded), so
     * stock was never decremented and cleanup just marks it CANCELLED. FAILED
     * payment status is swept too: the customer may retry within the cutoff
     * window (which flips the order to PAID), but an abandoned failed attempt
     * would otherwise sit in PENDING forever — the webhook's payment.failed
     * branch records FAILED without touching the order status.
     */
    @Query("select o from Order o "
        + "where o.status = com.prettycrafted.giftbox.domain.OrderStatus.PENDING "
        + "and o.paymentStatus in ("
        + "  com.prettycrafted.giftbox.domain.PaymentStatus.PENDING, "
        + "  com.prettycrafted.giftbox.domain.PaymentStatus.FAILED) "
        + "and o.razorpayOrderId is not null "
        + "and o.createdAt < :cutoff")
    List<Order> findAbandonedRazorpayOrders(@Param("cutoff") java.time.Instant cutoff);

    @Query("select coalesce(sum(o.totalAmount), 0) from Order o "
        + "where o.paymentStatus = com.prettycrafted.giftbox.domain.PaymentStatus.SUCCESS")
    BigDecimal sumRevenue();

    @Query("select o.user.id, count(o), coalesce(sum(o.totalAmount), 0) from Order o "
        + "where o.paymentStatus = com.prettycrafted.giftbox.domain.PaymentStatus.SUCCESS "
        + "group by o.user.id")
    List<Object[]> findUserOrderStats();

    @Query("select count(oi) from OrderItem oi "
        + "join oi.order o "
        + "where o.user.id = :userId "
        + "and oi.product.id = :productId "
        + "and o.status in :statuses")
    long countUserPurchasesOfProduct(
        @Param("userId") Long userId,
        @Param("productId") Long productId,
        @Param("statuses") Collection<OrderStatus> statuses);
}
