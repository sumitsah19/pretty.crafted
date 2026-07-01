package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Occasion;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface OccasionRepository extends JpaRepository<Occasion, Long> {
    /** Admin: every occasion (including hidden ones), in browse-row order. */
    List<Occasion> findAllByOrderByDisplayOrderAscIdAsc();

    /** Storefront: only visible occasions — feeds both the browse row and the
     *  featured-banner selection. Hidden occasions never reach the public API. */
    List<Occasion> findByVisibleTrueOrderByDisplayOrderAscIdAsc();

    /**
     * Every occasion currently marked featured. Returns a {@link List}, not an
     * {@code Optional}/single entity, so a caller can never crash here even if the
     * "at most one featured" invariant is ever violated (e.g. by a manual DB edit,
     * or data seeded before this invariant was enforced) — callers should treat
     * more than one result as a data-integrity issue to self-heal, not a bug to
     * throw on. See {@link com.prettycrafted.giftbox.service.OccasionService}.
     */
    List<Occasion> findByFeaturedTrue();

    /**
     * Locks every occasion row for the duration of the current transaction.
     * Used by {@code toggleFeatured} so two concurrent admin clicks can never
     * both succeed and leave two rows featured — the second caller blocks until
     * the first transaction commits, then re-reads the now-current state. The
     * table is small (tens of rows), so locking all of it is cheap and simpler
     * than reasoning about partial lock ordering / deadlocks.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Occasion o")
    List<Occasion> findAllForUpdate();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
