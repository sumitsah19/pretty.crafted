package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 20) String phone,
    @Size(max = 72) String currentPassword,
    // 72-byte cap matches BCrypt's own truncation point — anything beyond
    // 72 bytes is silently ignored when hashing.
    @Size(min = 8, max = 72) String newPassword
) {}
