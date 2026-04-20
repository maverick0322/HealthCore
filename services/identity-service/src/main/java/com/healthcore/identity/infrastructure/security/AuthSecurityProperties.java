package com.healthcore.identity.infrastructure.security;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "app.security")
public class AuthSecurityProperties {

    private final RateLimit rateLimit = new RateLimit();
    private final BruteForce bruteForce = new BruteForce();

    @Getter
    @Setter
    public static class RateLimit {
        private boolean enabled = true;

        @Min(value = 1, message = "app.security.rate-limit.auth-requests-per-minute must be greater than 0")
        private int authRequestsPerMinute = 30;
    }

    @Getter
    @Setter
    public static class BruteForce {
        private boolean enabled = true;

        @Min(value = 1, message = "app.security.brute-force.max-failed-attempts must be greater than 0")
        private int maxFailedAttempts = 5;

        @Min(value = 1, message = "app.security.brute-force.lock-minutes must be greater than 0")
        private int lockMinutes = 15;
    }
}

