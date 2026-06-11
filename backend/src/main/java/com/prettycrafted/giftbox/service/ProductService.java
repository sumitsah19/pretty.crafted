package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
import com.prettycrafted.giftbox.domain.ProductImage;
import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.ProductRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import com.prettycrafted.giftbox.repository.ProductRepository;
import java.util.List;
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

    public Page<ProductDto> list(Long categoryId, String q, Pageable pageable) {
        if (categoryId != null) {
            return productRepo.findByCategoryId(categoryId, pageable).map(ProductDto::from);
        }
        if (q != null && !q.isBlank()) {
            return productRepo.findByNameContainingIgnoreCase(q.trim(), pageable).map(ProductDto::from);
        }
        return productRepo.findAll(pageable).map(ProductDto::from);
    }

    public List<ProductDto> popular() {
        return productRepo.findTop6ByOrderByPopularityScoreDesc()
                .stream().map(ProductDto::from).toList();
    }

    /** All curated hamper products (the "Hampers" category), unpaginated. */
    public List<ProductDto> hampers() {
        return productRepo.findByCategory_NameIgnoreCaseOrderByIdAsc("Hampers")
                .stream().map(ProductDto::from).toList();
    }

    public ProductDto findById(Long id) {
        return productRepo.findById(id)
                .map(ProductDto::from)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    @Transactional
    public ProductDto create(ProductRequest req) {
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));

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
                .category(category)
                .recipient(req.recipient() != null ? req.recipient() : "all")
                .tag(req.tag() != null ? req.tag() : "")
                .rating(req.rating())
                .reviewCount(req.reviewCount())
                .build();

        addImages(product, urls);
        return ProductDto.from(productRepo.save(product));
    }

    @Transactional
    public ProductDto update(Long id, ProductRequest req) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));

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
        product.setCategory(category);
        if (req.recipient() != null) product.setRecipient(req.recipient());
        if (req.tag() != null) product.setTag(req.tag());
        product.setRating(req.rating());
        product.setReviewCount(req.reviewCount());

        product.getImages().clear();
        addImages(product, urls);

        return ProductDto.from(product);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepo.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        productRepo.deleteById(id);
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
