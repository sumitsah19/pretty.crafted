package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@BatchSize(size = 20)
@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Free-form tag the customer assigns ("Home", "Office", …). Optional.
    @Column(length = 40)
    private String label;

    @Column(name = "recipient_name", nullable = false, length = 120)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 200)
    private String line1;

    @Column(length = 200)
    private String line2;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(nullable = false, length = 20)
    private String zip;

    @Column(nullable = false, length = 80)
    @Builder.Default
    private String country = "India";

    // Exactly one address per user should be the default; the service enforces it.
    @Column(name = "is_default", columnDefinition = "BIT(1) NOT NULL DEFAULT 0")
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
