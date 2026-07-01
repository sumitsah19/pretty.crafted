package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.ProductImage;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.ProductRequest;
import com.prettycrafted.giftbox.exception.ConflictException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CartItemRepository;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import com.prettycrafted.giftbox.repository.ReviewRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final ReviewRepository reviewRepo;
    private final CartItemRepository cartItemRepo;

    public Page<ProductDto> list(Long categoryId, String q, Pageable pageable) {
        if (categoryId != null) {
            return productRepo.findByCategoriesId(categoryId, pageable).map(ProductDto::from);
        }
        if (q != null && !q.isBlank()) {
            return productRepo.findByNameContainingIgnoreCase(q.trim(), pageable).map(ProductDto::from);
        }
        return productRepo.findAll(pageable).map(ProductDto::from);
    }

    /** All curated hamper products (the "Hampers" category), unpaginated. */
    public List<ProductDto> hampers() {
        return productRepo.findByCategoriesNameIgnoreCase("Hampers")
                .stream().map(ProductDto::from).toList();
    }

    public ProductDto findById(Long id) {
        return productRepo.findById(id)
                .map(ProductDto::from)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    @Transactional
    public ProductDto create(ProductRequest req) {
        Set<Category> categories = resolveCategories(req.categoryIds());

        List<String> urls = req.imageUrls() != null ? req.imageUrls() : List.of();
        String primary = urls.isEmpty() ? null : urls.get(0);

        Product product = Product.builder()
                .name(req.name())
                .description(req.description())
                .materials(req.materials())
                .care(req.care())
                .shippingAndReturns(req.shippingAndReturns())
                .price(req.price())
                .originalPrice(req.originalPrice())
                .stock(req.stock())
                .imageUrl(primary)
                .categories(categories)
                .recipients(req.recipients() != null ? new LinkedHashSet<>(req.recipients()) : new LinkedHashSet<>())
                .tag(req.tag() != null ? req.tag() : "")
                .heroSlot(req.heroSlot())
                .build();

        addImages(product, urls);
        return ProductDto.from(productRepo.save(product));
    }

    @Transactional
    public ProductDto update(Long id, ProductRequest req) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        Set<Category> categories = resolveCategories(req.categoryIds());

        List<String> urls = req.imageUrls() != null ? req.imageUrls() : List.of();
        String primary = urls.isEmpty() ? null : urls.get(0);

        product.setName(req.name());
        product.setDescription(req.description());
        product.setMaterials(req.materials());
        product.setCare(req.care());
        product.setShippingAndReturns(req.shippingAndReturns());
        product.setPrice(req.price());
        product.setOriginalPrice(req.originalPrice());
        product.setStock(req.stock());
        product.setImageUrl(primary);
        product.setCategories(categories);
        if (req.recipients() != null) product.setRecipients(new LinkedHashSet<>(req.recipients()));
        if (req.tag() != null) product.setTag(req.tag());
        product.setHeroSlot(req.heroSlot());

        product.getImages().clear();
        addImages(product, urls);

        return ProductDto.from(product);
    }

    /**
     * Blocks deletion when the product has real history it would orphan (the
     * products/order_items and products/review FKs have no cascade, so
     * deleting anyway would otherwise fail with a raw, confusing DB error —
     * see GlobalExceptionHandler's generic DataIntegrityViolationException
     * message, which was written for an unrelated conflict). Deleting a
     * product with sales/review history isn't something admin should be able
     * to do at all — hiding it (removing all categories) is the correct action.
     */
    @Transactional
    public void delete(Long id) {
        if (!productRepo.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        if (productRepo.existsInOrders(id)) {
            throw new ConflictException(
                "This product has order history and can't be deleted. Remove it from all categories instead so it stops appearing in the storefront.");
        }
        if (reviewRepo.countByProductId(id) > 0) {
            throw new ConflictException(
                "This product has customer reviews and can't be deleted. Remove it from all categories instead so it stops appearing in the storefront.");
        }
        if (cartItemRepo.existsByProductId(id)) {
            throw new ConflictException(
                "This product is currently in a customer's cart and can't be deleted right now. Remove it from all categories instead so it stops appearing in the storefront.");
        }
        if (productRepo.existsInGiftBoxes(id)) {
            throw new ConflictException(
                "This product is currently part of a customer's gift box and can't be deleted right now. Remove it from all categories instead so it stops appearing in the storefront.");
        }
        productRepo.deleteById(id);
    }

    /** Fetches every requested category, failing fast if any id doesn't exist
     *  rather than silently saving a product with fewer categories than asked. */
    private Set<Category> resolveCategories(List<Long> categoryIds) {
        List<Category> found = categoryRepo.findAllById(categoryIds);
        if (found.size() != Set.copyOf(categoryIds).size()) {
            throw new NotFoundException("One or more categories not found: " + categoryIds);
        }
        return new LinkedHashSet<>(found);
    }

    private void addImages(Product product, List<String> urls) {
        for (int i = 0; i < urls.size(); i++) {
            ProductImage img = ProductImage.builder()
                    .product(product)
                    .imageUrl(urls.get(i))
                    .displayOrder(i)
                    .build();
            product.getImages().add(img);
        }
    }
}
