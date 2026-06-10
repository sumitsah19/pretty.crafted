package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.HeroCardDto;
import com.prettycrafted.giftbox.dto.HeroCardRequest;
import com.prettycrafted.giftbox.service.HeroCardService;
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

/** Admin: curate the hero CoverFlow cards (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/hero-cards")
@RequiredArgsConstructor
public class AdminHeroCardController {
    private final HeroCardService service;

    @GetMapping
    public List<HeroCardDto> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HeroCardDto create(@Valid @RequestBody HeroCardRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public HeroCardDto update(@PathVariable Long id, @Valid @RequestBody HeroCardRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    public HeroCardDto toggle(@PathVariable Long id) {
        return service.toggle(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
