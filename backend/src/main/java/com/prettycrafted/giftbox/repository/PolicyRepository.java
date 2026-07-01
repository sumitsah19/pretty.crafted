package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Policy;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    /** Storefront: only visible policies, in admin-defined order. */
    List<Policy> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    /** Admin: every policy, in display order. */
    List<Policy> findAllByOrderByDisplayOrderAscIdAsc();

    /** Storefront: fetch a single policy page by its URL slug. */
    Optional<Policy> findBySlugAndActiveTrue(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
