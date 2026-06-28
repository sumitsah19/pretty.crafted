package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Coupon;
import com.prettycrafted.giftbox.dto.CouponDto;
import com.prettycrafted.giftbox.dto.CouponRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CouponRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {
    private final CouponRepository repo;

    @Transactional(readOnly = true)
    public List<CouponDto> listAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream().map(CouponDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CouponDto> listActive() {
        return repo.findByActiveTrueOrderByCreatedAtDesc().stream().map(CouponDto::from).toList();
    }

    public CouponDto create(CouponRequest req) {
        String code = req.code().trim().toUpperCase();
        if (repo.existsByCode(code)) {
            throw new ConflictException("Coupon code already exists: " + code);
        }
        Coupon coupon = Coupon.builder()
            .code(code)
            .discountPercent(req.discountPercent())
            .expiresOn(req.expires() == null || req.expires().isBlank() ? "No expiry" : req.expires().trim())
            .active(true)
            .uses(0)
            .maxUses(req.maxUses())
            .build();
        return CouponDto.from(repo.save(coupon));
    }

    /** Checks a code without consuming a use — backs the checkout "Apply" button. */
    @Transactional(readOnly = true)
    public CouponDto validate(String code) {
        return CouponDto.from(requireRedeemable(code));
    }

    /**
     * Consumes one use of the coupon and returns the discount for the given
     * subtotal. Used for payment methods that finalise at placement (COD): the
     * order is committed in the same transaction, so a failed order does not
     * burn a use. For online payments the order is still unpaid and may be
     * abandoned — use {@link #previewDiscount} at placement and {@link #consume}
     * at confirmation instead.
     */
    public BigDecimal redeem(String code, BigDecimal subtotal) {
        Coupon coupon = requireRedeemable(code);
        // Atomic, conditional increment — the single-statement guard closes the
        // check-then-increment race when two orders redeem the last use at once.
        if (repo.incrementUsesIfAvailable(coupon.getId()) == 0) {
            throw new ConflictException("This coupon has been fully redeemed");
        }
        return discountFor(coupon, subtotal);
    }

    /**
     * Validates the coupon and returns the discount WITHOUT consuming a use.
     * Used at placement for online (Razorpay) payments, where the order may be
     * abandoned before payment completes; the use is consumed only once the
     * payment is confirmed (see {@link #consume}).
     */
    public BigDecimal previewDiscount(String code, BigDecimal subtotal) {
        return discountFor(requireRedeemable(code), subtotal);
    }

    /**
     * Records one redemption of an already-applied coupon, at payment
     * confirmation. Best effort and non-throwing: the discount was validated and
     * locked into the order at placement, so a paid order is never failed (or
     * refunded) just because the coupon has since been exhausted or removed.
     */
    public void consume(String code) {
        if (code == null || code.isBlank()) return;
        repo.findByCodeIgnoreCase(code.trim())
            .ifPresent(c -> repo.incrementUses(c.getId()));
    }

    /**
     * Returns one redemption when an order that had consumed a use is cancelled,
     * so a limited-use coupon isn't permanently burnt on an order that never
     * shipped. Best effort and non-throwing (the coupon may have since been
     * deleted); floored at 0 by the repository so a stray double-call can't push
     * the count negative.
     */
    public void restore(String code) {
        if (code == null || code.isBlank()) return;
        repo.findByCodeIgnoreCase(code.trim())
            .ifPresent(c -> repo.decrementUses(c.getId()));
    }

    private static BigDecimal discountFor(Coupon coupon, BigDecimal subtotal) {
        return subtotal
            .multiply(BigDecimal.valueOf(coupon.getDiscountPercent()))
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private Coupon requireRedeemable(String code) {
        Coupon coupon = repo.findByCodeIgnoreCase(code.trim())
            .orElseThrow(() -> new NotFoundException("Coupon code not found: " + code.trim().toUpperCase()));
        if (!coupon.isActive()) {
            throw new BadRequestException("This coupon is no longer active");
        }
        if (coupon.getMaxUses() != null && coupon.getUses() >= coupon.getMaxUses()) {
            throw new ConflictException("This coupon has been fully redeemed");
        }
        if (isExpired(coupon.getExpiresOn())) {
            throw new BadRequestException("This coupon has expired");
        }
        return coupon;
    }

    /**
     * expiresOn is a free-form label ("2026-06-30", "No expiry", …). Only
     * ISO dates are enforceable; anything unparseable never expires.
     */
    private static boolean isExpired(String expiresOn) {
        if (expiresOn == null || expiresOn.isBlank()) {
            return false;
        }
        try {
            return LocalDate.parse(expiresOn.trim()).isBefore(LocalDate.now());
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    public CouponDto toggle(Long id) {
        Coupon coupon = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Coupon not found: " + id));
        coupon.setActive(!coupon.isActive());
        return CouponDto.from(coupon);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Coupon not found: " + id);
        }
        repo.deleteById(id);
    }
}
