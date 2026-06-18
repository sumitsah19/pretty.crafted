package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.PasswordResetToken;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.OtpVerifyRequest;
import com.prettycrafted.giftbox.dto.RegisterRequest;
import com.prettycrafted.giftbox.dto.ResetPasswordRequest;
import com.prettycrafted.giftbox.dto.UpdateProfileRequest;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.repository.PasswordResetTokenRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepo;
    @Mock PasswordResetTokenRepository resetTokenRepo;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock EmailService emailService;
    @Mock Msg91Service msg91Service;

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

    @Test
    void register_normalizesPhoneToE164() {
        when(userRepo.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generate(any())).thenReturn("jwt");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        service.register(new RegisterRequest("new@example.com", "password1", "New", "09876543210"));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(captor.capture());
        // 0-prefixed input must be stored canonically so OTP login matches it later.
        assertEquals("+919876543210", captor.getValue().getPhone());
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

    // ─── Update profile (password change) ─────────────────────────────────────

    @Test
    void updateProfile_rejectsPasswordChangeWithoutCurrentPassword() {
        User user = User.builder().id(1L).email("u@example.com").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        var req = new UpdateProfileRequest("Name", null, null, "newpassword1");
        assertThrows(BadRequestException.class, () -> service.updateProfile(1L, req));
        assertEquals("hashed", user.getPasswordHash());
    }

    @Test
    void updateProfile_rejectsWrongCurrentPassword() {
        User user = User.builder().id(1L).email("u@example.com").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        var req = new UpdateProfileRequest("Name", null, "wrong", "newpassword1");
        assertThrows(BadRequestException.class, () -> service.updateProfile(1L, req));
        assertEquals("hashed", user.getPasswordHash());
    }

    @Test
    void updateProfile_changesPasswordWithCorrectCurrentPassword() {
        User user = User.builder().id(1L).email("u@example.com").passwordHash("hashed").role(Role.USER).build();
        int versionBefore = user.getTokenVersion();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newpassword1")).thenReturn("newhash");

        service.updateProfile(1L, new UpdateProfileRequest("Name", null, "correct", "newpassword1"));

        assertEquals("newhash", user.getPasswordHash());
        // Existing sessions must die with the old password.
        assertEquals(versionBefore + 1, user.getTokenVersion());
    }

    @Test
    void updateProfile_nameOnlyUpdateNeedsNoPassword() {
        User user = User.builder().id(1L).email("u@example.com").name("Old").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        service.updateProfile(1L, new UpdateProfileRequest("New Name", null, null, null));

        assertEquals("New Name", user.getName());
        assertEquals("hashed", user.getPasswordHash());
        verify(passwordEncoder, never()).matches(any(), any());
    }

    @Test
    void updateProfile_normalizesPhoneToE164() {
        User user = User.builder().id(1L).email("u@example.com").name("Old").passwordHash("hashed").role(Role.USER).build();
        when(userRepo.findById(1L)).thenReturn(Optional.of(user));

        service.updateProfile(1L, new UpdateProfileRequest("Name", "9876543210", null, null));

        assertEquals("+919876543210", user.getPhone());
    }

    // ─── Phone OTP login ──────────────────────────────────────────────────────

    @Test
    void loginWithOtp_failsClosedWhenMsg91ReturnsNoNumber() {
        when(msg91Service.verifyAccessToken("tok")).thenReturn(null);
        assertThrows(BadRequestException.class,
            () -> service.loginWithOtp(new OtpVerifyRequest("tok", "9876543210")));
        verify(userRepo, never()).save(any());
    }

    @Test
    void loginWithOtp_rejectsClaimedPhoneMismatch() {
        // MSG91 verified a different number than the one the client claims.
        when(msg91Service.verifyAccessToken("tok")).thenReturn("9876543210");
        assertThrows(BadRequestException.class,
            () -> service.loginWithOtp(new OtpVerifyRequest("tok", "9000000000")));
        verify(userRepo, never()).save(any());
    }

    @Test
    void loginWithOtp_reusesExistingAccountForVerifiedNumber() {
        when(msg91Service.verifyAccessToken("tok")).thenReturn("919876543210");
        User existing = User.builder().id(1L).phone("+919876543210").email("u@example.com").role(Role.USER).build();
        when(userRepo.findFirstByPhoneOrderByIdAsc("+919876543210")).thenReturn(Optional.of(existing));
        when(jwtService.generate(existing)).thenReturn("jwt");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        var result = service.loginWithOtp(new OtpVerifyRequest("tok", "9876543210"));

        assertEquals("jwt", result.token());
        verify(userRepo, never()).save(any()); // no duplicate created
    }

    @Test
    void loginWithOtp_createsAccountWhenNoneExists() {
        when(msg91Service.verifyAccessToken("tok")).thenReturn("9876543210");
        when(userRepo.findFirstByPhoneOrderByIdAsc("+919876543210")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generate(any())).thenReturn("jwt");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        var result = service.loginWithOtp(new OtpVerifyRequest("tok", "9876543210"));

        assertEquals("jwt", result.token());
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(captor.capture());
        assertEquals("+919876543210", captor.getValue().getPhone());
    }

    @Test
    void loginWithOtp_refetchesWinnerWhenInsertRacesUniqueConstraint() {
        when(msg91Service.verifyAccessToken("tok")).thenReturn("9876543210");
        User winner = User.builder().id(7L).phone("+919876543210").email("w@example.com").role(Role.USER).build();
        // First lookup finds nothing; after the unique-constraint hit, re-fetch finds the winner.
        when(userRepo.findFirstByPhoneOrderByIdAsc("+919876543210"))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(winner));
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepo.save(any())).thenThrow(new DataIntegrityViolationException("duplicate phone"));
        when(jwtService.generate(winner)).thenReturn("jwt");
        when(jwtService.expirationSeconds()).thenReturn(86400L);

        var result = service.loginWithOtp(new OtpVerifyRequest("tok", "9876543210"));

        assertEquals("jwt", result.token());
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
