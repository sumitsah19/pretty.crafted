package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Body for POST /api/auth/otp/verify.
 *
 * {@code accessToken} is the short-lived token the MSG91 widget returns on the
 * frontend after a successful client-side OTP verification — the backend
 * re-verifies it server-to-server with the secret AuthKey. {@code phone} is the
 * 10-digit Indian number the customer entered; it is used ONLY as a cross-check
 * against the number MSG91 reports it verified (the login is rejected on
 * mismatch). It is never the source of identity — that always comes from MSG91.
 */
public record OtpVerifyRequest(
    @NotBlank String accessToken,
    @NotBlank
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
    String phone
) {}
