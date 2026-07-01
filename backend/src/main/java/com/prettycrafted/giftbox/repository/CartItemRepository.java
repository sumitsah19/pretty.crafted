package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.CartItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);

    /** Used by ProductService.delete() to block deleting a product that's in someone's cart. */
    boolean existsByProductId(Long productId);
}
