package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Category;
import com.prettycrafted.giftbox.dto.CategoryDto;
import com.prettycrafted.giftbox.dto.CategoryRequest;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.CategoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    private final CategoryRepository repo;

    @Transactional(readOnly = true)
    public List<CategoryDto> findAll() {
        return repo.findAll().stream().map(CategoryDto::from).toList();
    }

    @Transactional(readOnly = true)
    public CategoryDto findBySlug(String slug) {
        return repo.findBySlug(slug).map(CategoryDto::from)
            .orElseThrow(() -> new NotFoundException("Category not found: " + slug));
    }

    public CategoryDto create(CategoryRequest req) {
        Category c = Category.builder()
            .name(req.name())
            .slug(req.slug())
            .description(req.description())
            .imageUrl(req.imageUrl())
            .build();
        return CategoryDto.from(repo.save(c));
    }

    public CategoryDto update(Long id, CategoryRequest req) {
        Category c = repo.findById(id)
            .orElseThrow(() -> new NotFoundException("Category not found: " + id));
        c.setName(req.name());
        c.setSlug(req.slug());
        c.setDescription(req.description());
        c.setImageUrl(req.imageUrl());
        return CategoryDto.from(c);
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Category not found: " + id);
        }
        repo.deleteById(id);
    }
}
