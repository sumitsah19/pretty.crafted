package com.prettycrafted.giftbox.repository;

import com.prettycrafted.giftbox.domain.MarketingConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MarketingConfigRepository extends JpaRepository<MarketingConfig, Long> {
}
