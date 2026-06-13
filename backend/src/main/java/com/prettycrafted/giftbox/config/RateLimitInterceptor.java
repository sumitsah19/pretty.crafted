package com.prettycrafted.giftbox.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // 5 requests per minute per IP
    private static final int CAPACITY = 5;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);
    // Sweep idle IPs once the map grows past this; keeps memory bounded under
    // traffic from many distinct IPs (real or spoofed X-Forwarded-For).
    private static final int SWEEP_THRESHOLD = 10_000;
    private static final long IDLE_EVICT_MILLIS = REFILL_PERIOD.toMillis() * 2;

    /** Bucket plus its last-seen time, so idle entries can be evicted. */
    private static final class Entry {
        final Bucket bucket;
        volatile long lastAccess;
        Entry(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccess = System.currentTimeMillis();
        }
    }

    private final Map<String, Entry> buckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws IOException {
        long now = System.currentTimeMillis();
        if (buckets.size() > SWEEP_THRESHOLD) {
            evictIdle(now);
        }
        String ip = resolveClientIp(request);
        Entry entry = buckets.computeIfAbsent(ip, k -> new Entry(newBucket()));
        entry.lastAccess = now;

        if (entry.bucket.tryConsume(1)) {
            return true;
        }

        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"code\":\"rate_limited\",\"message\":\"Too many requests. Please try again in a minute.\"}");
        response.setHeader("Retry-After", "60");
        return false;
    }

    /**
     * Drops entries idle longer than two refill periods. Safe: an evicted bucket
     * would have refilled to full capacity by then, so a returning IP simply gets
     * a fresh full bucket — identical to what eviction-then-recreate produces.
     */
    private void evictIdle(long now) {
        buckets.entrySet().removeIf(e -> now - e.getValue().lastAccess > IDLE_EVICT_MILLIS);
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
            .capacity(CAPACITY)
            .refillGreedy(CAPACITY, REFILL_PERIOD)
            .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (isTrustedProxy(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        try {
            InetAddress addr = InetAddress.getByName(ip);
            return addr.isLoopbackAddress() || addr.isSiteLocalAddress();
        } catch (Exception e) {
            return false;
        }
    }
}
