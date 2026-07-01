package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.PolicyDto;
import com.prettycrafted.giftbox.dto.PolicyRequest;
import com.prettycrafted.giftbox.service.PolicyService;
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

/** Admin: manage legal/policy pages (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/policies")
@RequiredArgsConstructor
public class AdminPolicyController {
    private final PolicyService service;

    @GetMapping
    public List<PolicyDto> list() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PolicyDto create(@Valid @RequestBody PolicyRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public PolicyDto update(@PathVariable Long id, @Valid @RequestBody PolicyRequest req) {
        return service.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    public PolicyDto toggle(@PathVariable Long id) {
        return service.toggle(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
