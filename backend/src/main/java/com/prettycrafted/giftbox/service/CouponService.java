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
     * subtotal. Called from order placement, inside the same transaction, so a
     * failed order does not burn a use.
     */
    public BigDecimal redeem(String code, BigDecimal subtotal) {
        Coupon coupon = requireRedeemable(code);
        coupon.setUses(coupon.getUses() + 1);
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
