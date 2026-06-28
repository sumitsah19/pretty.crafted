package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Coupon;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findAllByOrderByCreatedAtDesc();
    List<Coupon> findByActiveTrueOrderByCreatedAtDesc();
    boolean existsByCode(String code);
    Optional<Coupon> findByCodeIgnoreCase(String code);

    /** Atomically records one redemption, but only while uses are still available.
     *  Returns 1 if incremented, 0 if the coupon is already fully redeemed — the
     *  single-statement guard closes the check-then-increment race between
     *  concurrent orders. A null maxUses means unlimited. */
    @Modifying
    @Query("UPDATE Coupon c SET c.uses = c.uses + 1 " +
           "WHERE c.id = :id AND (c.maxUses IS NULL OR c.uses < c.maxUses)")
    int incrementUsesIfAvailable(@Param("id") Long id);

    /** Unconditionally records one redemption (atomic, no lost updates). Used at
     *  payment confirmation, where the discount was already honoured so the count
     *  must reflect reality even if maxUses has since been reached. */
    @Modifying
    @Query("UPDATE Coupon c SET c.uses = c.uses + 1 WHERE c.id = :id")
    void incrementUses(@Param("id") Long id);

    /** Atomically returns one redemption when an order that consumed a use is
     *  cancelled. Floored at 0 (the {@code c.uses > 0} guard) so a double-restore
     *  can never push the count negative. */
    @Modifying
    @Query("UPDATE Coupon c SET c.uses = c.uses - 1 WHERE c.id = :id AND c.uses > 0")
    void decrementUses(@Param("id") Long id);
}
