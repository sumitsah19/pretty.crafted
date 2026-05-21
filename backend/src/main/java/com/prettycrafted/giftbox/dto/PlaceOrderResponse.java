package com.prettycrafted.giftbox.dto;

public record PlaceOrderResponse(
    OrderDto order,
    String razorpayKeyId
) {}
