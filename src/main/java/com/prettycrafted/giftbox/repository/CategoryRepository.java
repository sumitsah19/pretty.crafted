package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.Category;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
    boolean existsByName(String name);
    boolean existsBySlug(String slug);
}
