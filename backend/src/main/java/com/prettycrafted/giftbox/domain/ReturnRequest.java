package com.prettycrafted.giftbox.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A customer-raised return or exchange request against a single delivered order item.
 * Moves through {@link ReturnStatus} as an admin reviews it. Optional evidence photos
 * are stored as Cloudinary URLs.
 */
@Entity
@Table(name = "return_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    /** Snapshot of the item name at request time (survives catalogue edits). */
    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ReturnType type;

    @Column(nullable = false, length = 120)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String details;

    /** Evidence photo URLs (Cloudinary). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "return_request_images", joinColumns = @JoinColumn(name = "return_request_id"))
    @Column(name = "image_url", length = 500)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private ReturnStatus status = ReturnStatus.PENDING;

    /** Optional admin note explaining an approval/rejection. */
    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
