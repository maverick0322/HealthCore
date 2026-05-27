package com.healthcore.identity.application;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActiveUserMetricsTracker {

    private static final Duration WINDOW = Duration.ofDays(1);
    private final MeterRegistry meterRegistry;
    private final Map<String, Instant> lastLoginByUserId = new ConcurrentHashMap<>();

    public ActiveUserMetricsTracker(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @PostConstruct
    void registerGauge() {
        meterRegistry.gauge("identity.active_users.last_day", Tags.of("window", "1d"), this, tracker -> (double) tracker.countActiveUsers());
    }

    public void recordLogin(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        lastLoginByUserId.put(userId, Instant.now());
        pruneExpired();
    }

    public int countActiveUsers() {
        pruneExpired();
        return lastLoginByUserId.size();
    }

    private void pruneExpired() {
        Instant cutoff = Instant.now().minus(WINDOW);
        lastLoginByUserId.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
    }
}
