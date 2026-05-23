package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, columnDefinition = "VARCHAR(16) NOT NULL DEFAULT 'USER'")
    @Builder.Default
    private Role role = Role.USER;

    @Column(name = "token_version", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private int tokenVersion = 0;

    @Column(name = "email_verified", columnDefinition = "BIT(1) NOT NULL DEFAULT 0")
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "email_notifications", columnDefinition = "BIT(1) NOT NULL DEFAULT 1")
    @Builder.Default
    private boolean emailNotifications = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
