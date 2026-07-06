package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.MarketingConfig;
import com.prettycrafted.giftbox.dto.MarketingDto;
import com.prettycrafted.giftbox.dto.PublicMarketingDto;
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

    // Shown until the admin saves their own lines. Must match the storefront's
    // BANNER_BASE fallback (frontend App.jsx) so first boot looks identical.
    private static final List<String> DEFAULT_BANNER = Arrays.asList(
            "✦ Free delivery on orders above ₹999",
            "🎁 Handcrafted with love, delivered across India",
            "✦ New arrivals every week");

    @Transactional(readOnly = true)
    public MarketingDto get() {
        MarketingConfig cfg = repo.findAll().stream().findFirst().orElse(null);
        MarketingDto dto = new MarketingDto();
        // Null (no row yet, or a row from before the column existed) = enabled.
        dto.setBannerEnabled(cfg == null || cfg.getBannerEnabled() == null || cfg.getBannerEnabled());
        if (cfg == null || cfg.getBannerLines() == null || cfg.getBannerLines().isBlank()) {
            dto.setBannerLines(DEFAULT_BANNER);
            if (cfg != null) dto.setId(cfg.getId());
            return dto;
        }
        dto.setId(cfg.getId());
        dto.setBannerLines(splitLines(cfg.getBannerLines()));
        return dto;
    }

    /** Storefront shape — same data minus the row id. */
    @Transactional(readOnly = true)
    public PublicMarketingDto getPublic() {
        MarketingDto cfg = get();
        PublicMarketingDto dto = new PublicMarketingDto();
        dto.setBannerLines(cfg.getBannerLines());
        dto.setBannerEnabled(Boolean.TRUE.equals(cfg.getBannerEnabled()));
        return dto;
    }

    public MarketingDto update(MarketingDto req) {
        MarketingConfig cfg = repo.findAll().stream().findFirst().orElse(new MarketingConfig());
        String joined = String.join("\n", req.getBannerLines() == null ? List.of() : req.getBannerLines());
        cfg.setBannerLines(joined);
        cfg.setBannerEnabled(req.getBannerEnabled() == null || req.getBannerEnabled());
        cfg = repo.save(cfg);
        MarketingDto dto = new MarketingDto();
        dto.setId(cfg.getId());
        dto.setBannerLines(splitLines(cfg.getBannerLines()));
        dto.setBannerEnabled(cfg.getBannerEnabled() == null || cfg.getBannerEnabled());
        return dto;
    }

    private static List<String> splitLines(String joined) {
        return Arrays.stream(joined.split("\\n")).map(String::trim)
                .filter(s -> !s.isEmpty()).toList();
    }
}
