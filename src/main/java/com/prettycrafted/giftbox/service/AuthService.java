package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.PasswordResetToken;
import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.AuthResponse;
import com.prettycrafted.giftbox.dto.ForgotPasswordRequest;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.RegisterRequest;
import com.prettycrafted.giftbox.dto.ResetPasswordRequest;
import com.prettycrafted.giftbox.dto.UpdateProfileRequest;
import com.prettycrafted.giftbox.dto.UserDto;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.PasswordResetTokenRepository;
import com.prettycrafted.giftbox.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (userRepo.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }
        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(req.password()))
            .name(req.name().trim())
            .phone(req.phone())
            .role(Role.USER)
            .build();
        userRepo.save(user);
        return buildResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public UserDto getById(Long id) {
        return userRepo.findById(id).map(UserDto::from)
            .orElseThrow(() -> new NotFoundException("User not found: " + id));
    }

    public UserDto updateProfile(Long id, UpdateProfileRequest req) {
        User user = userRepo.findById(id)
            .orElseThrow(() -> new NotFoundException("User not found: " + id));
        user.setName(req.name().trim());
        if (req.phone() != null && !req.phone().isBlank()) {
            user.setPhone(req.phone().trim());
        }
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
            user.setTokenVersion(user.getTokenVersion() + 1);
        }
        return UserDto.from(user);
    }

    public void forgotPassword(ForgotPasswordRequest req) {
        userRepo.findByEmail(req.email().trim().toLowerCase()).ifPresent(user -> {
            resetTokenRepo.deleteByUser(user);
            String token = UUID.randomUUID().toString().replace("-", "");
            resetTokenRepo.save(PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());
            emailService.sendPasswordResetEmail(user, token);
        });
    }

    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken prt = resetTokenRepo.findByToken(req.token())
            .orElseThrow(() -> new BadRequestException("Invalid or expired token"));
        if (prt.isUsed()) {
            throw new BadRequestException("Token already used");
        }
        if (prt.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Token has expired");
        }
        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        prt.setUsed(true);
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generate(user), jwtService.expirationSeconds(), UserDto.from(user));
    }
}
