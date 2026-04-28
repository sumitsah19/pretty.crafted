package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 20) String phone,
    @Size(min = 8, max = 100) String newPassword
) {}
