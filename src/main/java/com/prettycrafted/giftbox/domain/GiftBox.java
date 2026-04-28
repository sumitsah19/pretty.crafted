package com.prettycrafted.giftbox.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "gift_boxes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiftBox {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "box_size", nullable = false, length = 16)
    private BoxSize size;

    @Enumerated(EnumType.STRING)
    @Column(name = "wrap_type", nullable = false, length = 16)
    @Builder.Default
    private WrapType wrapType = WrapType.STANDARD;

    @Column(name = "custom_message", length = 150)
    private String customMessage;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "wrap_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal wrapPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private GiftBoxStatus status = GiftBoxStatus.DRAFT;

    @OneToMany(mappedBy = "giftBox", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<GiftBoxItem> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
