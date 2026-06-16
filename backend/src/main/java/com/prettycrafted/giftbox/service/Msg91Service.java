package com.prettycrafted.giftbox.service;

import com.prettycrafted.giftbox.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Server-side bridge to MSG91. The widget on the frontend performs the actual
 * send/verify OTP exchange and, on success, hands the browser a short-lived
 * access token. This service re-verifies that token against MSG91 using the
 * secret AuthKey, which never leaves the backend (requirement: never expose the
 * AuthKey in the frontend).
 */
@Slf4j
@Service
public class Msg91Service {

    private static final String VERIFY_URL =
        "https://control.msg91.com/api/v5/widget/verifyAccessToken";

    @Value("${msg91.auth-key:}")
    private String authKey;

    // Bounded timeouts so a slow/hung MSG91 endpoint can never pin a request
    // thread indefinitely (which, under load, would exhaust the Tomcat pool and
    // take the whole API down). A failed/timed-out call surfaces as a
    // RestClientException below and becomes a clean 400 to the caller.
    private final RestClient rest = RestClient.builder()
        .requestFactory(timeoutRequestFactory())
        .build();

    private static SimpleClientHttpRequestFactory timeoutRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); // ms — fail fast if MSG91 is unreachable
        factory.setReadTimeout(5000);    // ms — cap how long we wait for a response
        return factory;
    }

    @PostConstruct
    void check() {
        if (!isConfigured()) {
            log.warn("msg91.auth-key is not set — phone OTP login is disabled. "
                + "Set the MSG91_AUTH_KEY environment variable to enable it.");
        }
    }

    public boolean isConfigured() {
        return authKey != null && !authKey.isBlank();
    }

    /**
     * Verifies the widget access token server-to-server.
     *
     * @return the verified mobile identifier MSG91 reports (digits only, may
     *         include the 91 country code), or {@code null} if MSG91's success
     *         response did not contain a number — in which case the caller must
     *         fall back to the client-submitted phone.
     * @throws BadRequestException if phone login is unconfigured, or the token is
     *         invalid/expired/rejected by MSG91.
     */
    public String verifyAccessToken(String accessToken) {
        if (!isConfigured()) {
            throw new BadRequestException("Phone login is not configured on this server");
        }

        // MSG91 expects the field name "access-token" (hyphenated), alongside the
        // AuthKey. Both travel server-to-server only.
        Map<String, String> payload = Map.of(
            "authkey", authKey,
            "access-token", accessToken
        );

        Map<?, ?> resp;
        try {
            resp = rest.post()
                .uri(VERIFY_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(Map.class);
        } catch (RestClientException e) {
            // MSG91 answers 4xx with a JSON body when the token is bad; any
            // transport/HTTP failure is a verification failure, not a server 500.
            log.warn("MSG91 verifyAccessToken call failed: {}", e.getMessage());
            throw new BadRequestException("Could not verify the OTP. Please try again.");
        }

        Object type = resp == null ? null : resp.get("type");
        if (resp == null || !"success".equalsIgnoreCase(String.valueOf(type))) {
            String msg = resp == null ? "no response" : String.valueOf(resp.get("message"));
            log.warn("MSG91 verifyAccessToken rejected token: {}", msg);
            throw new BadRequestException("OTP verification failed or expired. Please try again.");
        }

        // On a successful widget verification MSG91 echoes the verified mobile in
        // "message". Return its digits so the caller can bind the session to the
        // number MSG91 actually verified rather than one the client merely claims.
        String message = String.valueOf(resp.get("message"));
        String digits = message.replaceAll("\\D", "");
        return digits.isBlank() ? null : digits;
    }
}
