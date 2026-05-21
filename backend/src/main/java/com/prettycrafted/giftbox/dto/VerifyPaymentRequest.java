package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
    @NotBlank String razorpayPaymentId,
    @NotBlank String razorpayOrderId,
    @NotBlank String razorpaySignature
) {}
