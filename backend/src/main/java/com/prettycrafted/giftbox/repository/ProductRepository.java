package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
    List<Product> findTop6ByOrderByPopularityScoreDesc();
    long countByStockLessThanEqual(int threshold);

    /** Atomically decrement stock and increment popularityScore.
     *  Returns 1 if the row was updated (sufficient stock), 0 if out of stock. */
    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock - :qty, p.popularityScore = p.popularityScore + :qty " +
           "WHERE p.id = :id AND p.stock >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") int qty);

    /** Restore stock when an order is cancelled. */
    @Modifying
    @Query("UPDATE Product p SET p.stock = p.stock + :qty WHERE p.id = :id")
    void incrementStock(@Param("id") Long id, @Param("qty") int qty);
}
