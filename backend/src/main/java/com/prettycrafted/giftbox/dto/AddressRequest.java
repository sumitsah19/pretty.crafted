package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
    @Size(max = 40) String label,
    @NotBlank @Size(max = 120) String recipientName,
    @NotBlank @Size(max = 20) String phone,
    @NotBlank @Size(max = 200) String line1,
    @Size(max = 200) String line2,
    @NotBlank @Size(max = 100) String city,
    @Size(max = 100) String state,
    @NotBlank @Size(max = 20) String zip,
    @Size(max = 80) String country,
    boolean isDefault
) {}
