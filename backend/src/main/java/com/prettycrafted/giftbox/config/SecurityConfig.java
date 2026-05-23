package com.prettycrafted.giftbox.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.prettycrafted.giftbox.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${springdoc.swagger-ui.enabled:false}")
    private boolean swaggerEnabled;

    // ═══════════════════════════════════════════════════════════════════════════
    // Chain 1 — PUBLIC (Order 1, highest priority)
    //
    // WHY TWO CHAINS?
    // Spring Security's BearerTokenAuthenticationFilter (added by
    // oauth2ResourceServer) executes BEFORE authorization rules are checked.
    // If a browser sends an expired/stale pc_token cookie to a permitAll()
    // endpoint like /api/products, the JWT filter rejects it with 401 before
    // permitAll() is ever reached.
    //
    // Solution: public endpoints get their own SecurityFilterChain with NO
    // oauth2ResourceServer configured → BearerTokenAuthenticationFilter is
    // never registered → stale cookies are silently ignored → 200 OK.
    // ═══════════════════════════════════════════════════════════════════════════
    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                // ── Product & category reads ───────────────────────────
                "/api/products/**",
                "/api/categories/**",
                "/api/public/**",
                // ── Auth endpoints (no token needed) ─────────────────
                "/api/auth/register",
                "/api/auth/login",
                "/api/auth/google",
                "/api/auth/logout",
                "/api/auth/forgot-password",
                "/api/auth/reset-password",
                "/api/auth/unsubscribe",
                "/api/auth/verify-email",
                "/api/auth/resend-verification",
                // ── Other public endpoints ────────────────────────────
                "/api/payments/webhook",
                "/api/sentry-test",
                "/api/dev/**",
                // ── OpenAPI / Swagger (only active when enabled) ──────
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html",
                // ── Static assets served by Spring Boot ──────────────
                "/",
                "/index.html",
                "/favicon.ico",
                "/favicon.svg",
                "/logo.svg",
                "/logo.png",
                "/robots.txt",
                "/sitemap.xml",
                "/uploads/**",
                "/assets/**",
                "/*.css",
                "/*.js",
                "/*.html",
                "/*.png",
                "/*.jpg",
                "/*.jpeg",
                "/*.svg",
                "/*.webp",
                "/*.gif",
                "/*.ico"
            )
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // No oauth2ResourceServer here — JWT filter is NOT added.
            // Any token in the request is simply ignored on these paths.
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Chain 2 — SECURED (Order 2, catches everything not matched by Chain 1)
    //
    // Full JWT validation. Stale/invalid tokens correctly return 401.
    // /api/auth/me falls here: 401 when unauthenticated is intentional —
    // the frontend fetchMe() handles this gracefully.
    // ═══════════════════════════════════════════════════════════════════════════
    @Bean
    @Order(2)
    public SecurityFilterChain securedFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Admin routes — ROLE_ADMIN required
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // Product/category writes — ROLE_ADMIN required
                .requestMatchers(HttpMethod.POST,   "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH,  "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**", "/api/categories/**").hasRole("ADMIN")
                // File uploads — ROLE_ADMIN required
                .requestMatchers(HttpMethod.POST, "/api/uploads/**").hasRole("ADMIN")
                // Everything else (cart, orders, account, etc.) — any authenticated user
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth
                .bearerTokenResolver(bearerTokenResolver())
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter()))
            )
            .httpBasic(b -> b.disable())
            .formLogin(f -> f.disable());

        return http.build();
    }

    // ── Beans shared by both chains ──────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtEncoder jwtEncoder(@Value("${app.jwt.secret}") String secret) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey(secret)));
    }

    @Bean
    public JwtDecoder jwtDecoder(
        @Value("${app.jwt.secret}") String secret,
        UserRepository userRepo
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withSecretKey(secretKey(secret))
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefault(),
            new TokenVersionValidator(userRepo)
        ));
        return decoder;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = jwt.getClaimAsString("role");
            return role == null
                ? List.of()
                : List.of(new SimpleGrantedAuthority("ROLE_" + role));
        });
        return converter;
    }

    /**
     * Resolves bearer token from Authorization header first, then pc_token cookie.
     * Only used by Chain 2 (secured). Chain 1 never calls this.
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver headerResolver = new DefaultBearerTokenResolver();
        return request -> {
            // Authorization header takes precedence over cookie
            String token = headerResolver.resolve(request);
            if (token != null) return token;
            // Fall back to HttpOnly cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie c : cookies) {
                    if ("pc_token".equals(c.getName())) return c.getValue();
                }
            }
            return null;
        };
    }

    /**
     * CORS configuration — shared by both chains via the CorsConfigurationSource bean.
     *
     * Railway env var to set:
     *   CORS_ALLOWED_ORIGINS=https://prettycrafted.com
     *
     * Multiple origins (comma-separated):
     *   CORS_ALLOWED_ORIGINS=https://prettycrafted.com,https://www.prettycrafted.com
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
        @Value("${app.cors.allowed-origins}") String origins
    ) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", config);
        return src;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private SecretKey secretKey(String secret) {
        return new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8),
            "HmacSHA256"
        );
    }
}
