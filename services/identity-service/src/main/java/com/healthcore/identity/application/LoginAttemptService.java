package com.healthcore.identity.application;

import com.healthcore.identity.infrastructure.security.AuthSecurityProperties;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private final AuthSecurityProperties authSecurityProperties;
    private final Map<String, AttemptState> attemptStates = new ConcurrentHashMap<>();

    public LoginAttemptService(AuthSecurityProperties authSecurityProperties) {
        this.authSecurityProperties = authSecurityProperties;
    }

    public boolean isBlocked(String loginKey) {
        if (!authSecurityProperties.getBruteForce().isEnabled()) {
            return false;
        }

        AttemptState state = attemptStates.get(normalize(loginKey));
        if (state == null) {
            return false;
        }

        if (state.lockedUntil != null && Instant.now().isAfter(state.lockedUntil)) {
            attemptStates.remove(normalize(loginKey));
            return false;
        }

        return state.lockedUntil != null && Instant.now().isBefore(state.lockedUntil);
    }

    public void recordFailedAttempt(String loginKey) {
        if (!authSecurityProperties.getBruteForce().isEnabled()) {
            return;
        }

        String normalizedKey = normalize(loginKey);
        attemptStates.compute(normalizedKey, (ignored, state) -> {
            AttemptState current = state == null ? new AttemptState() : state;

            if (current.lockedUntil != null && Instant.now().isBefore(current.lockedUntil)) {
                return current;
            }

            if (current.lockedUntil != null && Instant.now().isAfter(current.lockedUntil)) {
                current.failedAttempts = 0;
                current.lockedUntil = null;
            }

            current.failedAttempts++;
            if (current.failedAttempts >= authSecurityProperties.getBruteForce().getMaxFailedAttempts()) {
                current.lockedUntil = Instant.now().plus(Duration.ofMinutes(authSecurityProperties.getBruteForce().getLockMinutes()));
            }

            return current;
        });
    }

    public void recordSuccessfulAttempt(String loginKey) {
        attemptStates.remove(normalize(loginKey));
    }

    private String normalize(String loginKey) {
        return loginKey == null ? "" : loginKey.trim().toLowerCase();
    }

    private static class AttemptState {
        private int failedAttempts;
        private Instant lockedUntil;
    }
}

