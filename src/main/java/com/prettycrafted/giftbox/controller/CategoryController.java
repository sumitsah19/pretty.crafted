package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.CategoryDto;
import com.prettycrafted.giftbox.dto.CategoryRequest;
import com.prettycrafted.giftbox.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    public List<CategoryDto> list() {
        return service.findAll();
    }

    @GetMapping("/{slug}")
    public CategoryDto bySlug(@PathVariable String slug) {
        return service.findBySlug(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
