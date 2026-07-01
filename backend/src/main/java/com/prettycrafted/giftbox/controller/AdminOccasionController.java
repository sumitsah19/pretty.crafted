package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.OccasionDto;
import com.prettycrafted.giftbox.dto.OccasionRequest;
import com.prettycrafted.giftbox.service.OccasionService;
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

/** Admin: manage the occasion catalog and featured-banner eligibility (ROLE_ADMIN via Chain 2). */
@RestController
@RequestMapping("/api/admin/occasions")
@RequiredArgsConstructor
public class AdminOccasionController {
    private final OccasionService service;

    @GetMapping
    public List<OccasionDto> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OccasionDto create(@Valid @RequestBody OccasionRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public OccasionDto update(@PathVariable Long id, @Valid @RequestBody OccasionRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    public OccasionDto toggle(@PathVariable Long id) {
        return service.toggle(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
