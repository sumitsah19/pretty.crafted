package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Occasion;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OccasionRepository extends JpaRepository<Occasion, Long> {
    /** Admin: every occasion (including hidden ones), in browse-row order. */
    List<Occasion> findAllByOrderByDisplayOrderAscIdAsc();

    /** Storefront: only visible occasions — feeds both the browse row and the
     *  featured-banner selection. Hidden occasions never reach the public API. */
    List<Occasion> findByVisibleTrueOrderByDisplayOrderAscIdAsc();

    /** The occasion currently shown in the featured banner slot, if any — the
     *  service maintains the invariant that at most one row has this set. */
    Optional<Occasion> findByFeaturedTrue();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
