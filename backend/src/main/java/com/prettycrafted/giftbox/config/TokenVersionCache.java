package com.prettycrafted.giftbox.config;

import com.prettycrafted.giftbox.repository.UserRepository;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Short-TTL cache of each user's {@code tokenVersion}, so the per-request JWT
 * check (see {@link TokenVersionValidator}) doesn't hit the database on every
 * single authenticated call — only on a cache miss or after the entry expires.
 *
 * <p>Revocation stays near-immediate: {@link #invalidate(long)} is called after a
 * password change commits, so the very next request reloads the bumped version
 * and any session carrying the old one is rejected. Even without that call, a
 * stale entry self-heals within {@link #TTL_MILLIS}.
 *
 * <p>No external cache dependency: a plain {@link ConcurrentHashMap} with
 * opportunistic eviction, mirroring {@link RateLimitInterceptor}.
 */
@Component
@RequiredArgsConstructor
public class TokenVersionCache {

    private static final long TTL_MILLIS = 60_000;
    // Sweep expired entries once the map grows past this, keeping memory bounded.
    private static final int SWEEP_THRESHOLD = 50_000;

    private record Entry(int version, long expiresAt) {}

    private final Map<Long, Entry> cache = new ConcurrentHashMap<>();
    private final UserRepository userRepository;

    /**
     * The user's current token version, or empty if the user no longer exists.
     * Served from cache when fresh; otherwise loaded and cached.
     */
    public Optional<Integer> getTokenVersion(long userId) {
        long now = System.currentTimeMillis();
        Entry cached = cache.get(userId);
        if (cached != null && cached.expiresAt() > now) {
            return Optional.of(cached.version());
        }
        if (cache.size() > SWEEP_THRESHOLD) {
            cache.entrySet().removeIf(e -> e.getValue().expiresAt() <= now);
        }
        Optional<Integer> loaded = userRepository.findById(userId).map(u -> u.getTokenVersion());
        loaded.ifPresent(v -> cache.put(userId, new Entry(v, now + TTL_MILLIS)));
        return loaded;
    }

    /** Drop the cached version so the next request reloads it (call after a token-version bump commits). */
    public void invalidate(long userId) {
        cache.remove(userId);
    }
}
