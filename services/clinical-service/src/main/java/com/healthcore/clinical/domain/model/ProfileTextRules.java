package com.healthcore.clinical.domain.model;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

final class ProfileTextRules {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}](?:[\\p{L}' -]*[\\p{L}])?$");
    private static final Pattern DIGITS_PATTERN = Pattern.compile("^\\d+$");

    private ProfileTextRules() {
    }

    static String requireUserId(String userId) {
        String normalized = normalizeText(userId);
        if (normalized == null) {
            throw new IllegalArgumentException("User ID cannot be null or empty.");
        }
        return normalized;
    }

    static String validateRequiredName(String value, String fieldName) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        validateNamePattern(normalized, fieldName);
        validateMaxLength(normalized, 50, fieldName);
        return normalized;
    }

    static String validateOptionalName(String value, String fieldName) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        validateNamePattern(normalized, fieldName);
        validateMaxLength(normalized, 50, fieldName);
        return normalized;
    }

    static String validateRequiredText(String value, int maxLength, String fieldName) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }
        validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    static String validateOptionalText(String value, int maxLength, String fieldName) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        validateMaxLength(normalized, maxLength, fieldName);
        return normalized;
    }

    static String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    static String normalizeDigits(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        if (!DIGITS_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Value must contain only digits.");
        }
        return normalized;
    }

    static String validateAllowedValue(
            String value,
            Set<String> allowedValues,
            boolean required,
            String fieldName
    ) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            if (required) {
                throw new IllegalArgumentException(fieldName + " is required.");
            }
            return null;
        }
        if (!allowedValues.contains(normalized)) {
            throw new IllegalArgumentException(fieldName + " is invalid.");
        }
        return normalized;
    }

    static List<String> normalizeAndValidateList(
            List<String> values,
            Set<String> allowedValues,
            int maxItems,
            int maxLength,
            String fieldName
    ) {
        LinkedHashSet<String> deduplicated = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = normalizeText(value);
            if (normalized == null) {
                continue;
            }
            validateMaxLength(normalized, maxLength, fieldName);
            if (!allowedValues.contains(normalized)) {
                throw new IllegalArgumentException(fieldName + " contains an invalid value.");
            }
            deduplicated.add(normalized);
        }
        if (deduplicated.size() > maxItems) {
            throw new IllegalArgumentException(fieldName + " exceeds the maximum number of allowed values.");
        }
        return List.copyOf(deduplicated);
    }

    static List<String> normalizeAndValidateFreeTextList(
            List<String> values,
            int maxItems,
            int maxLength,
            String fieldName
    ) {
        LinkedHashSet<String> deduplicated = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = normalizeText(value);
            if (normalized == null) {
                continue;
            }
            validateMaxLength(normalized, maxLength, fieldName);
            deduplicated.add(normalized);
        }
        if (deduplicated.size() > maxItems) {
            throw new IllegalArgumentException(fieldName + " exceeds the maximum number of allowed values.");
        }
        return List.copyOf(deduplicated);
    }

    private static void validateNamePattern(String value, String fieldName) {
        if (!NAME_PATTERN.matcher(value).matches()) {
            throw new IllegalArgumentException(fieldName + " must contain only letters, spaces, apostrophes, or hyphens.");
        }
    }

    private static void validateMaxLength(String value, int maxLength, String fieldName) {
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " must be at most " + maxLength + " characters long.");
        }
    }
}
