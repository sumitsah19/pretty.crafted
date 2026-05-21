package com.prettycrafted.giftbox.dto;

public record AuthResponse(String token, long expiresInSeconds, UserDto user) {}
