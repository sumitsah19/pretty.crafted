package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);
    boolean existsByProductIdAndUserId(Long productId, Long userId);

    long countByProductId(Long productId);

    /** Null when the product has no reviews yet — callers must handle that case. */
    @Query("select avg(r.rating) from Review r where r.product.id = :productId")
    Double averageRatingByProductId(Long productId);
}
