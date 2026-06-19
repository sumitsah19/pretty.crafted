package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.Role;
import com.prettycrafted.giftbox.domain.User;
import com.prettycrafted.giftbox.dto.AuthResponse;
import com.prettycrafted.giftbox.dto.GoogleAuthRequest;
import com.prettycrafted.giftbox.dto.LoginRequest;
import com.prettycrafted.giftbox.dto.OtpVerifyRequest;
import com.prettycrafted.giftbox.dto.UpdateProfileRequest;
import com.prettycrafted.giftbox.dto.UserDto;
import com.prettycrafted.giftbox.exception.BadRequestException;
import com.prettycrafted.giftbox.exception.NotFoundException;
import com.prettycrafted.giftbox.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import java.util.Collections;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final Msg91Service msg91Service;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    private GoogleIdTokenVerifier googleVerifier;

    @PostConstruct
    void initGoogleVerifier() {
        if (googleClientId != null && !googleClientId.isBlank()) {
            googleVerifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
        }
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
            user.setPhone(canonicalPhone(req.phone()));
        }
        if (req.newPassword() != null && !req.newPassword().isBlank()) {
            // A hijacked session must not be enough to take over the account:
            // changing the password requires proving knowledge of the current one.
            if (req.currentPassword() == null || req.currentPassword().isBlank()
                    || !passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
            user.setTokenVersion(user.getTokenVersion() + 1);
        }
        return UserDto.from(user);
    }

    public AuthResponse loginWithGoogle(GoogleAuthRequest req) {
        if (googleVerifier == null) {
            throw new BadRequestException("Google login is not configured on this server");
        }

        // Verify signature, audience, issuer and expiry locally — no HTTP call per
        // login
        GoogleIdToken idToken;
        try {
            idToken = googleVerifier.verify(req.credential());
        } catch (Exception e) {
            throw new BadRequestException("Google token verification failed: " + e.getMessage());
        }

        if (idToken == null) {
            throw new BadRequestException("Invalid or expired Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();

        if (!payload.getEmailVerified()) {
            throw new BadRequestException("Google account email is not verified");
        }

        String email = payload.getEmail().trim().toLowerCase();
        String name = (String) payload.getOrDefault("name", email.split("@")[0]);

        // Find existing user (any sign-in method) or create a new Google-only account
        User user = userRepo.findByEmail(email).orElseGet(() -> userRepo.save(User.builder()
                .email(email)
                .name(name != null ? name.trim() : email.split("@")[0])
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .emailVerified(true)
                .build()));
        // Mark existing Google users as verified (Google has already confirmed their
        // email)
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
        }

        return buildResponse(user);
    }

    /**
     * Phone OTP login/registration. The MSG91 widget has already verified the OTP
     * on the client; here we re-verify the resulting access token server-to-server
     * (AuthKey stays on the backend), then find-or-create the user by phone and
     * issue our own JWT — mirroring {@link #loginWithGoogle}.
     *
     * <p>
     * Runs outside the class-level transaction ({@code NOT_SUPPORTED}) so that
     * the find-or-create insert commits in its own transaction: if a concurrent
     * OTP login for the same new number wins the race, the unique index on
     * {@code users.phone} rejects our insert and we can re-fetch the winner
     * instead of poisoning a shared transaction.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public AuthResponse loginWithOtp(OtpVerifyRequest req) {
        // 1) Prove the OTP flow completed AND learn the number MSG91 actually
        // verified. Identity is derived solely from MSG91's response — never
        // from client-supplied input.
        String verifiedDigits = msg91Service.verifyAccessToken(req.accessToken());
        String phone = normalizeIndianPhone(verifiedDigits);
        if (phone == null) {
            // MSG91 confirmed a token but did not return a usable verified number.
            // We must FAIL CLOSED here: falling back to the client-submitted phone
            // would let a caller present a token verified for their own number and
            // be logged in as any number they type. Do not trust client input for
            // identity.
            log.warn("MSG91 verifyAccessToken succeeded but returned no usable mobile number");
            throw new BadRequestException("Could not verify your mobile number. Please try again.");
        }

        // 2) Defense in depth: the client tells us which number it expects to log
        // in as. It must match the number MSG91 actually verified — otherwise
        // the token was issued for a different number than the one claimed.
        if (req.phone() != null && !req.phone().isBlank()) {
            String claimed = normalizeIndianPhone(req.phone());
            if (claimed == null || !claimed.equals(phone)) {
                log.warn("OTP phone mismatch: client-claimed number does not match the MSG91-verified number");
                throw new BadRequestException("Mobile number mismatch. Please restart the login.");
            }
        }

        // 3) Find-or-create, race-safe (see method javadoc).
        User user = userRepo.findFirstByPhoneOrderByIdAsc(phone)
                .orElseGet(() -> createPhoneUser(phone));
        return buildResponse(user);
    }

    /**
     * Creates a phone-only account. These have no email/password, so we store a
     * non-routable placeholder email (the column is NOT NULL + unique) and a
     * random password hash they never use — same trick the Google flow uses.
     *
     * <p>
     * If a concurrent OTP login for the same new number inserted first, the
     * unique index on {@code users.phone} makes our insert fail; we then re-fetch
     * and return the winner rather than creating a duplicate row.
     */
    private User createPhoneUser(String phone) {
        try {
            return userRepo.save(User.builder()
                    .phone(phone)
                    .name("User")
                    .email(phone.replace("+", "") + "@phone.prettycrafted.invalid")
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .emailVerified(false)
                    .emailNotifications(false)
                    .build());
        } catch (DataIntegrityViolationException raceLost) {
            log.info("Lost phone-account creation race for a number — using the existing account");
            return userRepo.findFirstByPhoneOrderByIdAsc(phone)
                    .orElseThrow(() -> raceLost);
        }
    }

    /**
     * Normalises an Indian mobile number to {@code +91XXXXXXXXXX}, accepting raw
     * 10-digit, 0-prefixed, 91-prefixed or +91-prefixed input. Returns {@code null}
     * if the result is not a valid 10-digit number starting 6–9.
     */
    /**
     * Phone value to persist on a user. Returns the canonical E.164 form when the
     * input is a valid Indian mobile (so a later phone-OTP login resolves to this
     * same account instead of creating a duplicate), otherwise the trimmed input
     * so we never silently drop a number we can't parse. Blank/null → {@code null}.
     */
    private static String canonicalPhone(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = normalizeIndianPhone(raw);
        return normalized != null ? normalized : raw.trim();
    }

    private static String normalizeIndianPhone(String raw) {
        if (raw == null) {
            return null;
        }
        String d = raw.replaceAll("\\D", "");
        if (d.length() == 12 && d.startsWith("91")) {
            d = d.substring(2);
        } else if (d.length() == 11 && d.startsWith("0")) {
            d = d.substring(1);
        }
        if (d.length() != 10 || "012345".indexOf(d.charAt(0)) >= 0) {
            return null; // must be exactly 10 digits starting 6–9
        }
        return "+91" + d;
    }

    public void unsubscribe(Long userId, String sig) {
        if (!emailService.verifyUnsubscribeToken(userId, sig)) {
            throw new BadRequestException("Invalid unsubscribe link");
        }
        userRepo.findById(userId).ifPresent(user -> {
            user.setEmailNotifications(false);
            userRepo.save(user);
        });
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(jwtService.generate(user), jwtService.expirationSeconds(), UserDto.from(user));
    }
}
