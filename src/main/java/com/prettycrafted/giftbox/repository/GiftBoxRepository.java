package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.GiftBox;
import com.prettycrafted.giftbox.domain.GiftBoxStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GiftBoxRepository extends JpaRepository<GiftBox, Long> {
    List<GiftBox> findByUserIdAndStatus(Long userId, GiftBoxStatus status);
}
