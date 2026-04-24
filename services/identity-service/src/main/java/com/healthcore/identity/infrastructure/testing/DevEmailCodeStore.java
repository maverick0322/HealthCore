package com.healthcore.identity.infrastructure.testing;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Profile({"dev", "local"})
public class DevEmailCodeStore {

    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Map<String, String> passwordResetCodes = new ConcurrentHashMap<>();

    public void saveVerificationCode(String email, String code) {
        verificationCodes.put(email, code);
    }

    public String getVerificationCode(String email) {
        return verificationCodes.get(email);
    }

    public void savePasswordResetCode(String email, String code) {
        passwordResetCodes.put(email, code);
    }

    public String getPasswordResetCode(String email) {
        return passwordResetCodes.get(email);
    }
}
