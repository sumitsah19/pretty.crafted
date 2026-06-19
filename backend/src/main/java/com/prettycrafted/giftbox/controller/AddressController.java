package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.AddressDto;
import com.prettycrafted.giftbox.dto.AddressRequest;
import com.prettycrafted.giftbox.service.AddressService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
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

/**
 * Customer address book. All endpoints are authenticated (no Chain 1 matcher),
 * and every operation is scoped to the caller's own user id so one customer can
 * never read or mutate another's addresses.
 */
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService service;

    @GetMapping
    public List<AddressDto> list(@AuthenticationPrincipal Jwt jwt) {
        return service.list(userId(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddressRequest req) {
        return service.create(userId(jwt), req);
    }

    @PutMapping("/{id}")
    public AddressDto update(@AuthenticationPrincipal Jwt jwt,
                            @PathVariable Long id,
                            @Valid @RequestBody AddressRequest req) {
        return service.update(userId(jwt), id, req);
    }

    @PatchMapping("/{id}/default")
    public AddressDto setDefault(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return service.setDefault(userId(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        service.delete(userId(jwt), id);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
