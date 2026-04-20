package com.healthcore.identity.application;

import com.healthcore.identity.infrastructure.security.AuthSecurityProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptServiceTest {

    @Test
    void should_BlockAfterConfiguredFailedAttempts() {
        AuthSecurityProperties properties = new AuthSecurityProperties();
        properties.getBruteForce().setEnabled(true);
        properties.getBruteForce().setMaxFailedAttempts(3);
        properties.getBruteForce().setLockMinutes(5);

        LoginAttemptService service = new LoginAttemptService(properties);
        String key = "patient@healthcore.com";

        service.recordFailedAttempt(key);
        service.recordFailedAttempt(key);
        assertThat(service.isBlocked(key)).isFalse();

        service.recordFailedAttempt(key);
        assertThat(service.isBlocked(key)).isTrue();
    }

    @Test
    void should_ClearBlockOnSuccessfulAttempt() {
        AuthSecurityProperties properties = new AuthSecurityProperties();
        properties.getBruteForce().setEnabled(true);
        properties.getBruteForce().setMaxFailedAttempts(1);
        properties.getBruteForce().setLockMinutes(5);

        LoginAttemptService service = new LoginAttemptService(properties);
        String key = "patient@healthcore.com";

        service.recordFailedAttempt(key);
        assertThat(service.isBlocked(key)).isTrue();

        service.recordSuccessfulAttempt(key);
        assertThat(service.isBlocked(key)).isFalse();
    }
}

