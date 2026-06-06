package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.MarketingConfig;
import com.prettycrafted.giftbox.dto.MarketingDto;
import com.prettycrafted.giftbox.repository.MarketingConfigRepository;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MarketingService {
    private final MarketingConfigRepository repo;

    private static final List<String> DEFAULT_BANNER = Arrays.asList(
            "✦ Free gift wrapping on orders over ₹5000",
            "🎁 Handcrafted with love, delivered across India",
            "✦ New arrivals every week");

    @Transactional(readOnly = true)
    public MarketingDto get() {
        MarketingConfig cfg = repo.findAll().stream().findFirst().orElse(null);
        MarketingDto dto = new MarketingDto();
        if (cfg == null || cfg.getBannerLines() == null || cfg.getBannerLines().isBlank()) {
            dto.setBannerLines(DEFAULT_BANNER);
            return dto;
        }
        List<String> lines = Arrays.stream(cfg.getBannerLines().split("\\n")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList();
        dto.setId(cfg.getId());
        dto.setBannerLines(lines);
        return dto;
    }

    public MarketingDto update(MarketingDto req) {
        MarketingConfig cfg = repo.findAll().stream().findFirst().orElse(new MarketingConfig());
        String joined = String.join("\n", req.getBannerLines() == null ? List.of() : req.getBannerLines());
        cfg.setBannerLines(joined);
        cfg = repo.save(cfg);
        MarketingDto dto = new MarketingDto();
        dto.setId(cfg.getId());
        dto.setBannerLines(
                Arrays.stream(cfg.getBannerLines().split("\\n")).map(String::trim).filter(s -> !s.isEmpty()).toList());
        return dto;
    }
}
