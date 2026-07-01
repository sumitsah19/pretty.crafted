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
    @Query("select distinct p from Product p join p.categories c where c.id = :categoryId")
    Page<Product> findByCategoriesId(@Param("categoryId") Long categoryId, Pageable pageable);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("select distinct p from Product p join p.categories c where lower(c.name) = lower(:name) order by p.id asc")
    List<Product> findByCategoriesNameIgnoreCase(@Param("name") String categoryName);

    long countByStockLessThanEqual(int threshold);

    /** Used only to gate the one-time hero-slot starter seed — see
     *  DataSeeder.backfillHeroSlots(). True once any product has been curated
     *  into a homepage hero carousel slot, whether by that seed or an admin edit. */
    boolean existsByHeroSlotIsNotNull();

    /** Used by ProductService.delete() to block deleting a product with real
     *  order history — the products/order_items FK has no cascade, so deleting
     *  it anyway would otherwise fail with a raw, confusing DB error. */
    @Query("select count(oi) > 0 from OrderItem oi where oi.product.id = :productId")
    boolean existsInOrders(@Param("productId") Long productId);

    /** Same as {@link #existsInOrders}, but for gift boxes a product is currently part of. */
    @Query("select count(gi) > 0 from GiftBoxItem gi where gi.product.id = :productId")
    boolean existsInGiftBoxes(@Param("productId") Long productId);

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

    // ── One-time migration off the legacy singular category_id / recipient columns.
    // Product no longer maps either column, so these read the raw values via native
    // SQL purely for DataSeeder.backfillCategoriesAndRecipients() to seed the new
    // product_categories / product_recipients tables. See that method's doc.

    /** Raw (product id, category_id) pairs left over from the old single-category column. */
    @Query(value = "SELECT id, category_id FROM products WHERE category_id IS NOT NULL", nativeQuery = true)
    List<Object[]> findLegacyCategoryLinks();

    /** Raw (product id, recipient) pairs left over from the old single-recipient column,
     *  excluding "all" and blank — both are now represented as an empty recipients set. */
    @Query(value = "SELECT id, recipient FROM products WHERE recipient IS NOT NULL AND TRIM(recipient) NOT IN ('', 'all')", nativeQuery = true)
    List<Object[]> findLegacyRecipients();

    /**
     * The old category_id column was {@code NOT NULL} with no default; now that
     * {@code Product} no longer maps it, new inserts would violate that constraint
     * unless it's relaxed. Idempotent — re-running MODIFY on an already-nullable
     * column is a harmless no-op.
     */
    @Modifying
    @Query(value = "ALTER TABLE products MODIFY COLUMN category_id BIGINT NULL", nativeQuery = true)
    void relaxLegacyCategoryIdConstraint();
}
