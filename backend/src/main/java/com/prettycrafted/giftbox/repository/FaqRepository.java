package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Faq;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    /** Storefront: only visible FAQs, in admin-defined order. */
    List<Faq> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    /** Admin: every FAQ, in display order. */
    List<Faq> findAllByOrderByDisplayOrderAscIdAsc();
}
