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
@Transactional
public class ProductService {
    private final ProductRepository repo;
    private final CategoryRepository categoryRepo;

    @Transactional(readOnly = true)
    public Page<ProductDto> list(Long categoryId, String q, Pageable pageable) {
        if (categoryId != null) {
            return repo.findByCategoryId(categoryId, pageable).map(ProductDto::from);
        }
        if (q != null && !q.isBlank()) {
            return repo.findByNameContainingIgnoreCase(q.trim(), pageable).map(ProductDto::from);
        }
        return repo.findAll(pageable).map(ProductDto::from);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> popular() {
        return repo.findTop6ByOrderByPopularityScoreDesc().stream()
            .map(ProductDto::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductDto findById(Long id) {
        return repo.findById(id).map(ProductDto::from)
            .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    public ProductDto create(ProductRequest req) {
        Category cat = categoryRepo.findById(req.categoryId())
            .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));
        Product p = Product.builder()
            .name(req.name())
            .description(req.description())
            .price(req.price())
            .stock(req.stock())
            .imageUrl(req.imageUrl())
            .category(cat)
            .popularityScore(0)
            .build();
        return ProductDto.from(repo.save(p));
    }

    public ProductDto update(Long id, ProductRequest req) {
        Product p = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        Category cat = categoryRepo.findById(req.categoryId())
            .orElseThrow(() -> new NotFoundException("Category not found: " + req.categoryId()));
        p.setName(req.name());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setStock(req.stock());
        p.setImageUrl(req.imageUrl());
        p.setCategory(cat);
        return ProductDto.from(p);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        repo.deleteById(id);
    }
}
