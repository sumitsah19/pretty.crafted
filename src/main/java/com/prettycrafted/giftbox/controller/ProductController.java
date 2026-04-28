package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.ProductDto;
import com.prettycrafted.giftbox.dto.ProductRequest;
import com.prettycrafted.giftbox.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService service;

    @GetMapping
    public Page<ProductDto> list(
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) String q,
        @PageableDefault(size = 12) Pageable pageable
    ) {
        return service.list(categoryId, q, pageable);
    }

    @GetMapping("/popular")
    public List<ProductDto> popular() {
        return service.popular();
    }

    @GetMapping("/{id}")
    public ProductDto byId(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDto create(@Valid @RequestBody ProductRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public ProductDto update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
