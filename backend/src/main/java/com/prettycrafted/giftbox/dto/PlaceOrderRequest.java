package com.prettycrafted.giftbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PlaceOrderRequest(
    @NotBlank @Size(max = 500) String shippingAddress,
    @NotBlank @Size(max = 20) String contactPhone,
    @NotBlank @Pattern(regexp = "RAZORPAY|COD", message = "paymentMethod must be RAZORPAY or COD") String paymentMethod
) {}
