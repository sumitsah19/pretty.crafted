package com.prettycrafted.giftbox.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "marketing_config")
@Data
public class MarketingConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Stored as a single text block with lines separated by "\n"
    @Lob
    @Column(name = "banner_lines", columnDefinition = "text")
    private String bannerLines;

    /**
     * Whether the storefront shows the announcement banner at all.
     * Null (rows from before the column existed) means enabled.
     */
    @Column(name = "banner_enabled")
    private Boolean bannerEnabled;
}
