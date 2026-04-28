package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.AuthResponse;
import com.prettycrafted.giftbox.dto.ForgotPasswordRequest;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.RegisterRequest;
import com.prettycrafted.giftbox.dto.ResetPasswordRequest;
import com.prettycrafted.giftbox.dto.UpdateProfileRequest;
import com.prettycrafted.giftbox.dto.UserDto;
import com.prettycrafted.giftbox.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return service.getById(Long.valueOf(jwt.getSubject()));
    }

    @PutMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal Jwt jwt,
                            @Valid @RequestBody UpdateProfileRequest req) {
        return service.updateProfile(Long.valueOf(jwt.getSubject()), req);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        service.forgotPassword(req);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        service.resetPassword(req);
    }
}
