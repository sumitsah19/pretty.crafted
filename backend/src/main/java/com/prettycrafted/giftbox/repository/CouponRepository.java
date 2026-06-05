package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Coupon;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findAllByOrderByCreatedAtDesc();
    List<Coupon> findByActiveTrueOrderByCreatedAtDesc();
    boolean existsByCode(String code);
    Optional<Coupon> findByCodeIgnoreCase(String code);
}
