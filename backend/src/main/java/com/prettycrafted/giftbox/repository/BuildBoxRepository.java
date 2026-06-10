package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.BuildBox;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuildBoxRepository extends JpaRepository<BuildBox, Long> {
    /** Storefront: only visible boxes, in admin-defined order. */
    List<BuildBox> findByActiveTrueOrderByDisplayOrderAscIdAsc();

    /** Admin: every box, in display order. */
    List<BuildBox> findAllByOrderByDisplayOrderAscIdAsc();
}
