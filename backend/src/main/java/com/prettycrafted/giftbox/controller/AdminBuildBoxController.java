package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.BuildBoxDto;
import com.prettycrafted.giftbox.dto.BuildBoxRequest;
import com.prettycrafted.giftbox.service.BuildBoxService;
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

/** Admin: curate the "Build Your Own Box" boxes (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/build-boxes")
@RequiredArgsConstructor
public class AdminBuildBoxController {
    private final BuildBoxService service;

    @GetMapping
    public List<BuildBoxDto> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BuildBoxDto create(@Valid @RequestBody BuildBoxRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public BuildBoxDto update(@PathVariable Long id, @Valid @RequestBody BuildBoxRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    public BuildBoxDto toggle(@PathVariable Long id) {
        return service.toggle(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
