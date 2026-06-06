package com.prettycrafted.giftbox.dto;

import java.util.List;
import lombok.Data;

@Data
public class PublicMarketingDto {
    private List<CouponDto> promotions;
    private List<String> bannerLines;
}
