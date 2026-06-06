package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.CreateReviewRequest;
import com.prettycrafted.giftbox.dto.ReviewDto;
import com.prettycrafted.giftbox.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Public — served by Chain 1 (no JWT filter) via /api/products/** matcher. */
    @GetMapping("/products/{productId}/reviews")
    public List<ReviewDto> listReviews(@PathVariable Long productId) {
        return reviewService.getReviews(productId);
    }

    /** Authenticated — Chain 2. Returns whether the current user can review this product. */
    @GetMapping("/reviews/can-review/{productId}")
    public Map<String, Boolean> canReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return Map.of("canReview", reviewService.canReview(productId, userId));
    }

    /** Authenticated — Chain 2. Submit a review for a purchased product. */
    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto submitReview(
            @Valid @RequestBody CreateReviewRequest req,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = Long.parseLong(jwt.getSubject());
        return reviewService.submitReview(userId, req);
    }
}
