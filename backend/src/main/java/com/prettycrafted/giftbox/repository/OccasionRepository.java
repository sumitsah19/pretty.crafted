package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Occasion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OccasionRepository extends JpaRepository<Occasion, Long> {
    /** Every occasion, in browse-row order. Used by both the public and admin lists —
     *  the storefront browse row shows all occasions regardless of {@code active}. */
    List<Occasion> findAllByOrderByDisplayOrderAscIdAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
