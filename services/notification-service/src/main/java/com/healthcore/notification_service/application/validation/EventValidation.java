package com.healthcore.notification_service.application.validation;

import java.time.Clock;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import java.util.regex.Pattern;

public final class EventValidation {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private EventValidation() {
    }

    public static void requireNonBlank(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must not be blank");
        }
    }

    public static void requireEmail(String email, String fieldName) {
        requireNonBlank(email, fieldName);
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException(fieldName + " must be a valid email address");
        }
    }

    public static Instant requireParsableInstant(String value, String fieldName) {
        requireNonBlank(value, fieldName);
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException(fieldName + " must be a valid ISO-8601 timestamp", ex);
        }
    }

    public static Instant requireFutureInstant(String value, String fieldName, Clock clock) {
        Objects.requireNonNull(clock, "clock must not be null");
        Instant instant = requireParsableInstant(value, fieldName);
        Instant now = Instant.now(clock);
        if (!instant.isAfter(now)) {
            throw new IllegalArgumentException(fieldName + " must be in the future");
        }
        return instant;
    }

    public static void requireStartBeforeEnd(String start, String end, String startFieldName, String endFieldName) {
        Instant startInstant = requireParsableInstant(start, startFieldName);
        Instant endInstant = requireParsableInstant(end, endFieldName);
        if (!startInstant.isBefore(endInstant)) {
            throw new IllegalArgumentException(startFieldName + " must be before " + endFieldName);
        }
    }
}

