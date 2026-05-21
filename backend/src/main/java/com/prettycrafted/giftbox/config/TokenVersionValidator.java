package com.prettycrafted.giftbox.config;

import com.prettycrafted.giftbox.repository.UserRepository;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class TokenVersionValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID_TOKEN =
        new OAuth2Error("invalid_token", "Token has been invalidated", null);

    private final UserRepository userRepository;

    public TokenVersionValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Number claimedVersion = jwt.getClaim("tv");
        if (claimedVersion == null) {
            return OAuth2TokenValidatorResult.failure(INVALID_TOKEN);
        }
        try {
            long userId = Long.parseLong(jwt.getSubject());
            return userRepository.findById(userId)
                .map(user -> user.getTokenVersion() == claimedVersion.intValue()
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(INVALID_TOKEN))
                .orElse(OAuth2TokenValidatorResult.failure(INVALID_TOKEN));
        } catch (NumberFormatException e) {
            return OAuth2TokenValidatorResult.failure(INVALID_TOKEN);
        }
    }
}
