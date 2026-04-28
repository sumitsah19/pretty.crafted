package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.domain.User;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {
    private final JwtEncoder encoder;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public String generate(User user) {
        Instant now = Instant.now();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("prettycrafted")
            .issuedAt(now)
            .expiresAt(now.plus(expirationMs, ChronoUnit.MILLIS))
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .claim("name", user.getName())
            .claim("tv", user.getTokenVersion())
            .build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expirationSeconds() {
        return expirationMs / 1000;
    }
}
