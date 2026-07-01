package com.prettycrafted.giftbox.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(rateLimitInterceptor)
            .addPathPatterns(
                "/api/auth/login",
                "/api/auth/google",
                "/api/auth/otp/verify",
                // Unauthenticated and otherwise unlimited — without this, a script can
                // brute-force/enumerate active discount codes at any rate.
                "/api/public/coupons/validate",
                // Public write endpoint — cap how fast a script can flood the list.
                "/api/public/newsletter"
            );
    }
}
