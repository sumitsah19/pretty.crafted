package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.Size;

public record UpdateTrackingRequest(
    @Size(max = 80) String courier,
    @Size(max = 120) String trackingNumber,
    @Size(max = 500) String trackingUrl
) {}
