package com.prettycrafted.giftbox.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.prettycrafted.giftbox.dto.CreateReturnRequest;
import com.prettycrafted.giftbox.dto.ReturnRequestDto;
import com.prettycrafted.giftbox.service.ReturnService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** Customer: raise and track return/exchange requests (authenticated via Chain 2). */
@Slf4j
@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    private final ReturnService service;
    private final Cloudinary cloudinary;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestDto create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateReturnRequest req) {
        return service.create(userId(jwt), req);
    }

    @GetMapping
    public List<ReturnRequestDto> mine(@AuthenticationPrincipal Jwt jwt) {
        return service.listMine(userId(jwt));
    }

    /** Evidence photo upload for a return — available to any authenticated customer. */
    @PostMapping("/uploads")
    public Map<String, String> uploadEvidence(@RequestParam("file") MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, WEBP, GIF allowed");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File too large (max 5 MB)");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", "prettycrafted/returns")
            );
            return Map.of("url", (String) result.get("secure_url"));
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload failed");
        }
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
