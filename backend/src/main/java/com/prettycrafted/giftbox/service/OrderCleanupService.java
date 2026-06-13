package com.prettycrafted.giftbox.service;

import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sweeps abandoned unpaid Razorpay orders (dismissed checkout popups) so they
 * don't accumulate forever. These never decremented stock, so cancelling them
 * has no inventory side-effect — it just keeps the orders table clean and the
 * user's history honest.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderCleanupService {

    private static final Duration ABANDON_AFTER = Duration.ofHours(1);

    private final OrderService orderService;

    /** Runs hourly. */
    @Scheduled(fixedRate = 3_600_000L, initialDelay = 600_000L)
    public void cancelAbandonedOrders() {
        Instant cutoff = Instant.now().minus(ABANDON_AFTER);
        int cancelled = orderService.cancelAbandonedRazorpayOrders(cutoff);
        if (cancelled > 0) {
            log.info("Order cleanup: cancelled {} abandoned unpaid Razorpay order(s)", cancelled);
        }
    }
}
