package com.healthcore.notification_service.infrastructure.idempotency;

import com.healthcore.notification_service.application.port.NotificationIdempotencyStore;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryNotificationIdempotencyStore implements NotificationIdempotencyStore {

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();
    private final Clock clock;
    private final Duration sentTtl;
    private final Duration inProgressTtl;
    private final int maxEntries;

    public InMemoryNotificationIdempotencyStore(
            Clock clock,
            Duration sentTtl,
            Duration inProgressTtl,
            int maxEntries
    ) {
        this.clock = clock;
        this.sentTtl = sentTtl;
        this.inProgressTtl = inProgressTtl;
        this.maxEntries = maxEntries;
    }

    @Override
    public synchronized Registration register(String key) {
        Instant now = clock.instant();
        pruneExpired(now);

        Entry current = entries.get(key);
        if (current != null && current.expiresAt().isAfter(now)) {
            return current.status() == Status.SUCCEEDED ? Registration.ALREADY_SUCCEEDED : Registration.IN_PROGRESS;
        }

        evictOldestIfNeeded();
        entries.put(key, new Entry(Status.IN_PROGRESS, now.plus(inProgressTtl)));
        return Registration.ACQUIRED;
    }

    @Override
    public synchronized void markSucceeded(String key) {
        entries.put(key, new Entry(Status.SUCCEEDED, clock.instant().plus(sentTtl)));
    }

    @Override
    public synchronized void release(String key) {
        Entry current = entries.get(key);
        if (current != null && current.status() == Status.IN_PROGRESS) {
            entries.remove(key);
        }
    }

    private void pruneExpired(Instant now) {
        entries.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
    }

    private void evictOldestIfNeeded() {
        if (maxEntries <= 0 || entries.size() < maxEntries) {
            return;
        }
        entries.entrySet().stream()
                .min(Comparator.comparing(entry -> entry.getValue().expiresAt()))
                .ifPresent(entry -> entries.remove(entry.getKey()));
    }

    private enum Status {
        IN_PROGRESS,
        SUCCEEDED
    }

    private record Entry(Status status, Instant expiresAt) {
    }
}
