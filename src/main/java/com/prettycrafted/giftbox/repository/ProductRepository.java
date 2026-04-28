package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
    List<Product> findTop6ByOrderByPopularityScoreDesc();
    long countByStockLessThanEqual(int threshold);
}
