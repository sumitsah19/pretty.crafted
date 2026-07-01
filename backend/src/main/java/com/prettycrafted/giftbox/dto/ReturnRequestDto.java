package com.prettycrafted.giftbox.dto;

import com.prettycrafted.giftbox.domain.ReturnRequest;
import com.prettycrafted.giftbox.domain.ReturnStatus;
import com.prettycrafted.giftbox.domain.ReturnType;
import java.time.Instant;
import java.util.List;

public record ReturnRequestDto(
    Long id,
    Long orderId,
    Long orderItemId,
    String itemName,
    ReturnType type,
    String reason,
    String details,
    List<String> images,
    ReturnStatus status,
    String adminNote,
    Instant createdAt,
    Instant updatedAt,
    String userName,
    String userEmail
) {
    public static ReturnRequestDto from(ReturnRequest r) {
        return new ReturnRequestDto(
            r.getId(),
            r.getOrder().getId(),
            r.getOrderItem().getId(),
            r.getItemName(),
            r.getType(),
            r.getReason(),
            r.getDetails(),
            List.copyOf(r.getImages()),
            r.getStatus(),
            r.getAdminNote(),
            r.getCreatedAt(),
            r.getUpdatedAt(),
            r.getUser() != null ? r.getUser().getName() : null,
            r.getUser() != null ? r.getUser().getEmail() : null
        );
    }
}
