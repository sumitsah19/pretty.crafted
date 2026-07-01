package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.HeroCard;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroCardRepository extends JpaRepository<HeroCard, Long> {
    /** Storefront: only visible cards, in admin-defined order. */
    List<HeroCard> findByActiveTrueOrderByDisplayOrderAscIdAsc();
}
