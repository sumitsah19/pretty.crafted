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
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "popularity_score", columnDefinition = "INT NOT NULL DEFAULT 0")
    @Builder.Default
    private Integer popularityScore = 0;

    /** Target audience: "her", "him", "kids", or "all" */
    @Column(name = "recipient", columnDefinition = "VARCHAR(10) NOT NULL DEFAULT 'all'")
    @Builder.Default
    private String recipient = "all";

    /** Display badge: "Bestseller", "New", or "" */
    @Column(name = "tag", columnDefinition = "VARCHAR(30) NOT NULL DEFAULT ''")
    @Builder.Default
    private String tag = "";
}
