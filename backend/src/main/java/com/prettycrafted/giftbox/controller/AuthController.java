package com.prettycrafted.giftbox.controller;

import com.prettycrafted.giftbox.dto.AuthResponse;
import com.prettycrafted.giftbox.dto.ForgotPasswordRequest;
import com.prettycrafted.giftbox.dto.GoogleAuthRequest;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.OtpVerifyRequest;
import com.prettycrafted.giftbox.dto.RegisterRequest;
import com.prettycrafted.giftbox.dto.ResetPasswordRequest;
import com.prettycrafted.giftbox.dto.UpdateProfileRequest;
import com.prettycrafted.giftbox.dto.UserDto;
import com.prettycrafted.giftbox.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("pc_token", token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofMillis(jwtExpirationMs))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("pc_token", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletResponse response) {
        AuthResponse auth = service.register(req);
        setAuthCookie(response, auth.token());
        return auth;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        AuthResponse auth = service.login(req);
        setAuthCookie(response, auth.token());
        return auth;
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse response) {
        clearAuthCookie(response);
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

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody GoogleAuthRequest req, HttpServletResponse response) {
        AuthResponse auth = service.loginWithGoogle(req);
        setAuthCookie(response, auth.token());
        return auth;
    }

    /**
     * Phone OTP login. The MSG91 widget verifies the OTP client-side and returns
     * an access token; we re-verify it server-side and issue our own JWT. There is
     * deliberately no /otp/send endpoint — the widget SDK sends the OTP directly.
     */
    @PostMapping("/otp/verify")
    public AuthResponse otpVerify(@Valid @RequestBody OtpVerifyRequest req, HttpServletResponse response) {
        AuthResponse auth = service.loginWithOtp(req);
        setAuthCookie(response, auth.token());
        return auth;
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

    @GetMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@RequestParam String token) {
        service.verifyEmail(token);
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resendVerification(@AuthenticationPrincipal Jwt jwt) {
        service.resendVerification(Long.valueOf(jwt.getSubject()));
    }

    @GetMapping("/unsubscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@RequestParam Long id, @RequestParam String sig) {
        service.unsubscribe(id, sig);
    }

}
