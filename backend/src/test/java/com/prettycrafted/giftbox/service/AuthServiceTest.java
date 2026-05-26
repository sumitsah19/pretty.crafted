package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.PasswordResetToken;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.RegisterRequest;
import com.prettycrafted.giftbox.dto.ResetPasswordRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.repository.PasswordResetTokenRepository;
import com.prettycrafted.giftbox.repository.EmailVerificationTokenRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepo;
    @Mock PasswordResetTokenRepository resetTokenRepo;
    @Mock EmailVerificationTokenRepository verificationTokenRepo;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock EmailService emailService;

    @InjectMocks AuthService service;

    // ─── Register ─────────────────────────────────────────────────────────────

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        when(userRepo.existsByEmail("test@example.com")).thenReturn(true);
        var req = new RegisterRequest("test@example.com", "password1", "Test User", null);
        assertThrows(BadRequestException.class, () -> service.register(req));
        verify(userRepo, never()).save(any());
    }

    @Test
    void register_savesNewUserAndReturnsToken() {
        when(userRepo.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        User saved = User.builder().id(1L).email("new@example.com").name("New").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.save(any())).thenReturn(saved);
        when(jwtService.generate(any())).thenReturn("jwt-token");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        var result = service.register(new RegisterRequest("new@example.com", "password1", "New", null));

        assertNotNull(result.token());
        verify(userRepo).save(any(User.class));
    }

    // ─── Login ────────────────────────────────────────────────────────────────

    @Test
    void login_throwsOnUnknownEmail() {
        when(userRepo.findByEmail(any())).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class,
            () -> service.login(new LoginRequest("nobody@example.com", "pw")));
    }

    @Test
    void login_throwsOnWrongPassword() {
        User user = User.builder().email("u@example.com").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);
        assertThrows(BadRequestException.class,
            () -> service.login(new LoginRequest("u@example.com", "wrong")));
    }

    @Test
    void login_returnsTokenOnValidCredentials() {
        User user = User.builder().id(1L).email("u@example.com").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findByEmail("u@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generate(user)).thenReturn("jwt");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        var result = service.login(new LoginRequest("u@example.com", "correct"));
        assertEquals("jwt", result.token());
    }

    // ─── Reset password ───────────────────────────────────────────────────────

    @Test
    void resetPassword_throwsOnInvalidToken() {
        when(resetTokenRepo.findByToken("bad")).thenReturn(Optional.empty());
        assertThrows(BadRequestException.class,
            () -> service.resetPassword(new ResetPasswordRequest("bad", "newpassword")));
    }

    @Test
    void resetPassword_throwsOnAlreadyUsedToken() {
        PasswordResetToken prt = PasswordResetToken.builder()
            .token("tok").user(User.builder().build())
            .expiresAt(Instant.now().plusSeconds(3600)).used(true).build();
        when(resetTokenRepo.findByToken("tok")).thenReturn(Optional.of(prt));
        assertThrows(BadRequestException.class,
            () -> service.resetPassword(new ResetPasswordRequest("tok", "newpassword")));
    }

    @Test
    void resetPassword_throwsOnExpiredToken() {
        PasswordResetToken prt = PasswordResetToken.builder()
            .token("tok").user(User.builder().build())
            .expiresAt(Instant.now().minusSeconds(1)).used(false).build();
        when(resetTokenRepo.findByToken("tok")).thenReturn(Optional.of(prt));
        assertThrows(BadRequestException.class,
            () -> service.resetPassword(new ResetPasswordRequest("tok", "newpassword")));
    }

    @Test
    void resetPassword_updatesPasswordOnValidToken() {
        User user = User.builder().id(1L).email("u@example.com").passwordHash("old").role(Role.USER).build();
        PasswordResetToken prt = PasswordResetToken.builder()
            .token("tok").user(user)
            .expiresAt(Instant.now().plusSeconds(3600)).used(false).build();
        when(resetTokenRepo.findByToken("tok")).thenReturn(Optional.of(prt));
        when(passwordEncoder.encode("newpassword")).thenReturn("newhash");

        service.resetPassword(new ResetPasswordRequest("tok", "newpassword"));

        assertEquals("newhash", user.getPasswordHash());
        assertTrue(prt.isUsed());
    }

    // ─── Unsubscribe ──────────────────────────────────────────────────────────

    @Test
    void unsubscribe_throwsOnInvalidSignature() {
        when(emailService.verifyUnsubscribeToken(1L, "badsig")).thenReturn(false);
        assertThrows(BadRequestException.class, () -> service.unsubscribe(1L, "badsig"));
    }

    @Test
    void unsubscribe_setsEmailNotificationsFalse() {
        User user = User.builder().id(1L).email("u@example.com").emailNotifications(true).role(Role.USER).build();
        when(emailService.verifyUnsubscribeToken(1L, "validsig")).thenReturn(true);
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        service.unsubscribe(1L, "validsig");

        assertFalse(user.isEmailNotifications());
        verify(userRepo).save(user);
    }
}
