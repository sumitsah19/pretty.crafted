package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.FaqDto;
import com.prettycrafted.giftbox.dto.FaqRequest;
import com.prettycrafted.giftbox.service.FaqService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Admin: manage Help Center FAQs (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/faqs")
@RequiredArgsConstructor
public class AdminFaqController {
    private final FaqService service;

    @GetMapping
    public List<FaqDto> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FaqDto create(@Valid @RequestBody FaqRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public FaqDto update(@PathVariable Long id, @Valid @RequestBody FaqRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    public FaqDto toggle(@PathVariable Long id) {
        return service.toggle(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
