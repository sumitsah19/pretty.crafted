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
        assertEquals(new BigDecimal("10.00"), service.redeem("FESTIVE10", new BigDecimal("100.00")));
    }

    @Test
    void redeem_computesRoundedDiscountAndIncrementsUses() {
        Coupon c = coupon(15);
        when(repo.findByCodeIgnoreCase("festive10")).thenReturn(Optional.of(c));

        // 15% of 333.33 = 49.9995 → rounds to 50.00, never truncates to 49.99
        BigDecimal discount = service.redeem("festive10", new BigDecimal("333.33"));

        assertEquals(new BigDecimal("50.00"), discount);
        assertEquals(1, c.getUses());
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
}
