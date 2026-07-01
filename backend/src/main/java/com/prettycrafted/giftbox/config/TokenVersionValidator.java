package com.prettycrafted.giftbox.config;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class TokenVersionValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID_TOKEN =
        new OAuth2Error("invalid_token", "Token has been invalidated", null);

    // Reads through a short-TTL cache instead of the DB, so a valid session no
    // longer pays a DB round-trip on every request just for this check.
    private final TokenVersionCache tokenVersionCache;

    public TokenVersionValidator(TokenVersionCache tokenVersionCache) {
        this.tokenVersionCache = tokenVersionCache;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Number claimedVersion = jwt.getClaim("tv");
        if (claimedVersion == null) {
            return OAuth2TokenValidatorResult.failure(INVALID_TOKEN);
        }
        try {
            long userId = Long.parseLong(jwt.getSubject());
            return tokenVersionCache.getTokenVersion(userId)
                .map(current -> current == claimedVersion.intValue()
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(INVALID_TOKEN))
                .orElse(OAuth2TokenValidatorResult.failure(INVALID_TOKEN));
        } catch (NumberFormatException e) {
            return OAuth2TokenValidatorResult.failure(INVALID_TOKEN);
        }
    }
}
