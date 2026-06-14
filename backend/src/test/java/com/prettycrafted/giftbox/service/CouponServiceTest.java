package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Coupon;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CouponRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock CouponRepository repo;

    @InjectMocks CouponService service;

    private static Coupon coupon(int percent) {
        return Coupon.builder()
            .id(1L).code("FESTIVE10")
            .discountPercent(percent)
            .expiresOn("No expiry")
            .active(true).uses(0)
            .build();
    }

    // ─── Redeem ───────────────────────────────────────────────────────────────

    @Test
    void redeem_throwsOnUnknownCode() {
        when(repo.findByCodeIgnoreCase("NOPE")).thenReturn(Optional.empty());
        assertThrows(NotFoundException.class, () -> service.redeem("NOPE", new BigDecimal("100.00")));
    }

    @Test
    void redeem_throwsOnInactiveCoupon() {
        Coupon c = coupon(10);
        c.setActive(false);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        assertThrows(BadRequestException.class, () -> service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    @Test
    void redeem_throwsWhenMaxUsesExhausted() {
        Coupon c = coupon(10);
        c.setMaxUses(5);
        c.setUses(5);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        assertThrows(ConflictException.class, () -> service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    @Test
    void redeem_throwsOnExpiredIsoDate() {
        Coupon c = coupon(10);
        c.setExpiresOn(LocalDate.now().minusDays(1).toString());
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        assertThrows(BadRequestException.class, () -> service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    @Test
    void redeem_freeFormExpiryLabelNeverExpires() {
        Coupon c = coupon(10); // expiresOn = "No expiry"
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        when(repo.incrementUsesIfAvailable(1L)).thenReturn(1);
        assertEquals(new BigDecimal("10.00"), service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    @Test
    void redeem_computesRoundedDiscountAndRecordsUseAtomically() {
        Coupon c = coupon(15);
        when(repo.findByCodeIgnoreCase("festive10")).thenReturn(Optional.of(c));
        when(repo.incrementUsesIfAvailable(1L)).thenReturn(1);

        // 15% of 333.33 = 49.9995 → rounds to 50.00, never truncates to 49.99
        BigDecimal discount = service.redeem("festive10", new BigDecimal("333.33"));

        assertEquals(new BigDecimal("50.00"), discount);
        verify(repo).incrementUsesIfAvailable(1L); // atomic, not an in-memory mutation
    }

    @Test
    void redeem_throwsWhenIncrementLosesRace() {
        // Passes the up-front check, but a concurrent order grabbed the last use
        // first — the atomic UPDATE matches no row and reports it as exhausted.
        Coupon c = coupon(10);
        c.setMaxUses(2);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        when(repo.incrementUsesIfAvailable(1L)).thenReturn(0);

        assertThrows(ConflictException.class,
            () -> service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    // ─── Validate (no use consumed) ───────────────────────────────────────────

    @Test
    void validate_returnsDtoWithoutConsumingUse() {
        Coupon c = coupon(10);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));

        var dto = service.validate("FESTIVE10");

        assertEquals(10, dto.discountPercent());
        assertEquals(0, c.getUses());
    }

    // ─── previewDiscount (validate + amount, no use consumed) ──────────────────

    @Test
    void previewDiscount_computesDiscountWithoutConsumingUse() {
        Coupon c = coupon(15);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));

        // Same rounding as redeem, but the use count must stay untouched.
        BigDecimal discount = service.previewDiscount("FESTIVE10", new BigDecimal("333.33"));

        assertEquals(new BigDecimal("50.00"), discount);
        assertEquals(0, c.getUses());
    }

    @Test
    void previewDiscount_throwsWhenMaxUsesExhausted() {
        Coupon c = coupon(10);
        c.setMaxUses(5);
        c.setUses(5);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));
        assertThrows(ConflictException.class,
            () -> service.previewDiscount("FESTIVE10", new BigDecimal("100.00")));
    }

    // ─── consume (record one redemption at payment confirmation) ───────────────

    @Test
    void consume_incrementsUses() {
        Coupon c = coupon(10);
        when(repo.findByCodeIgnoreCase("FESTIVE10")).thenReturn(Optional.of(c));

        service.consume("FESTIVE10");

        verify(repo).incrementUses(1L); // atomic, unconditional (records reality)
    }

    @Test
    void consume_isNoOpForNullOrBlankCode() {
        service.consume(null);
        service.consume("   ");
        verifyNoInteractions(repo);
    }

    @Test
    void consume_isSilentWhenCouponNoLongerExists() {
        when(repo.findByCodeIgnoreCase("GONE")).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> service.consume("GONE"));
    }
}
