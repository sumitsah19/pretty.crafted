package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.Review;
import java.time.Instant;

public record ReviewDto(
    Long id,
    String userName,
    int rating,
    String body,
    Instant createdAt
) {
    public static ReviewDto from(Review r) {
        return new ReviewDto(
            r.getId(),
            r.getUser().getName(),
            r.getRating(),
            r.getBody(),
            r.getCreatedAt()
        );
    }
}
