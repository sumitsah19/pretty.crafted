package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.domain.ReturnStatus;
import com.prettycrafted.giftbox.dto.ReturnRequestDto;
import com.prettycrafted.giftbox.dto.UpdateReturnStatusRequest;
import com.prettycrafted.giftbox.service.ReturnService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin: review and resolve return/exchange requests (ROLE_ADMIN via Chain 2 /api/admin/**). */
@RestController
@RequestMapping("/api/admin/returns")
@RequiredArgsConstructor
public class AdminReturnController {
    private final ReturnService service;

    @GetMapping
    public List<ReturnRequestDto> list(@RequestParam(required = false) ReturnStatus status) {
        return service.adminList(status);
    }

    @PatchMapping("/{id}/status")
    public ReturnRequestDto updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateReturnStatusRequest req) {
        return service.updateStatus(id, req);
    }
}
