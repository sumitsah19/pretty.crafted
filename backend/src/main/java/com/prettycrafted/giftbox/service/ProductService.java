package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.domain.Product;
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

    public ProductDto findById(Long id) {
        return productRepo.findById(id)
                .map(ProductDto::from)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    @Transactional
    public ProductDto create(ProductRequest req) {
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));
        Product product = Product.builder()
                .name(req.name())
                .description(req.description())
                .price(req.price())
                .stock(req.stock())
                .imageUrl(req.imageUrl())
                .category(category)
                .recipient(req.recipient() != null ? req.recipient() : "all")
                .tag(req.tag() != null ? req.tag() : "")
                .build();
        return ProductDto.from(productRepo.save(product));
    }

    @Transactional
    public ProductDto update(Long id, ProductRequest req) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        Category category = categoryRepo.findById(req.categoryId())
                .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));
        product.setName(req.name());
        product.setDescription(req.description());
        product.setPrice(req.price());
        product.setStock(req.stock());
        product.setImageUrl(req.imageUrl());
        product.setCategory(category);
        if (req.recipient() != null) product.setRecipient(req.recipient());
        if (req.tag() != null) product.setTag(req.tag());
        return ProductDto.from(product);
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepo.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        productRepo.deleteById(id);
    }
}
