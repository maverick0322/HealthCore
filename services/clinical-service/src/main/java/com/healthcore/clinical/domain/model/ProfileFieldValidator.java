package com.healthcore.clinical.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

final class ProfileFieldValidator {

    private static final Pattern NAME_PATTERN = Pattern.compile("^[\\p{L}](?:[\\p{L}' -]*[\\p{L}])?$");
    private static final Pattern DIGITS_PATTERN = Pattern.compile("^\\d+$");

    private static final Set<String> PATIENT_GOALS = Set.of(
            "weight-loss",
            "muscle-gain",
            "health",
            "performance"
    );

    private static final Set<String> DIET_TYPES = Set.of(
            "omnivore",
            "vegetarian",
            "vegan",
            "keto",
            "paleo"
    );

    private static final Set<String> ALLERGY_TYPES = Set.of(
            "gluten",
            "lactose",
            "nuts",
            "seafood",
            "egg"
    );

    private static final Set<String> NUTRITIONIST_SPECIALIZATIONS = Set.of(
            "CLINICAL",
            "SPORTS",
            "PEDIATRIC",
            "GERIATRIC",
            "FOOD_SAFETY",
            "PERINATAL",
            "FOOD_TECHNOLOGY",
            "OTHER"
    );

    private static final Set<String> CONSULTATION_TYPES = Set.of(
            "PRESENTIAL",
            "ONLINE",
            "HOME_VISIT"
    );

    private ProfileFieldValidator() {
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

    static LocalDate validateBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            throw new IllegalArgumentException("Birth date is required.");
        }
        LocalDate today = LocalDate.now();
        if (birthDate.isAfter(today)) {
            throw new IllegalArgumentException("Birth date cannot be in the future.");
        }
        int age = Period.between(birthDate, today).getYears();
        if (age < 1 || age > 120) {
            throw new IllegalArgumentException("Birth date must represent an age between 1 and 120 years.");
        }
        return birthDate;
    }

    static LocalDate validateOptionalBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        return validateBirthDate(birthDate);
    }

    static Double validateHeightCm(Double heightCm) {
        if (heightCm == null) {
            throw new IllegalArgumentException("Height is required.");
        }
        if (heightCm < 100 || heightCm > 250) {
            throw new IllegalArgumentException("Height must be between 100 cm and 250 cm.");
        }
        if (heightCm.doubleValue() % 1 != 0) {
            throw new IllegalArgumentException("Height must be expressed as a whole number in centimeters.");
        }
        return heightCm;
    }

    static Double validateOptionalHeightCm(Double heightCm) {
        if (heightCm == null) {
            return null;
        }
        return validateHeightCm(heightCm);
    }

    static Double validateWeightKg(Double weightKg) {
        if (weightKg == null) {
            throw new IllegalArgumentException("Weight is required.");
        }
        if (weightKg < 40.0 || weightKg > 200.0) {
            throw new IllegalArgumentException("Weight must be between 40.0 kg and 200.0 kg.");
        }
        BigDecimal value = BigDecimal.valueOf(weightKg).stripTrailingZeros();
        if (value.scale() > 1) {
            throw new IllegalArgumentException("Weight must use at most one decimal place.");
        }
        return weightKg;
    }

    static Double validateOptionalWeightKg(Double weightKg) {
        if (weightKg == null) {
            return null;
        }
        return validateWeightKg(weightKg);
    }

    static String validatePatientGoal(String goal, boolean required) {
        return validateAllowedValue(goal, PATIENT_GOALS, required, "Goal");
    }

    static String validateDietType(String dietType, boolean required) {
        return validateAllowedValue(dietType, DIET_TYPES, required, "Diet type");
    }

    static List<String> validateAllergies(List<String> allergies) {
        if (allergies == null) {
            return List.of();
        }
        return normalizeAndValidateList(allergies, ALLERGY_TYPES, 5, 20, "Allergy");
    }

    static List<String> validateExcludedFoods(List<String> excludedFoods) {
        if (excludedFoods == null) {
            return List.of();
        }
        return normalizeAndValidateFreeTextList(excludedFoods, 15, 40, "Excluded food");
    }

    static List<String> validateSpecializations(
            List<String> specializations,
            String customSpecialization,
            boolean required
    ) {
        if (specializations == null || specializations.isEmpty()) {
            if (required) {
                throw new IllegalArgumentException("At least one specialization is required.");
            }
            return List.of();
        }

        List<String> normalized = normalizeAndValidateList(
                specializations,
                NUTRITIONIST_SPECIALIZATIONS,
                3,
                30,
                "Specialization"
        );

        if (normalized.contains("OTHER") && normalizeText(customSpecialization) == null) {
            throw new IllegalArgumentException("Custom specialization is required when OTHER is selected.");
        }
        return normalized;
    }

    static String validateCustomSpecialization(String customSpecialization) {
        String normalized = normalizeText(customSpecialization);
        if (normalized == null) {
            return null;
        }
        validateMaxLength(normalized, 60, "Custom specialization");
        return normalized;
    }

    static String validateProfessionalLicense(String professionalLicense) {
        String normalized = normalizeText(professionalLicense);
        if (normalized == null) {
            throw new IllegalArgumentException("Professional license is required.");
        }
        if (!DIGITS_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Professional license must contain only digits.");
        }
        if (normalized.length() < 7 || normalized.length() > 10) {
            throw new IllegalArgumentException("Professional license must contain between 7 and 10 digits.");
        }
        return normalized;
    }

    static String validateOptionalProfessionalLicense(String professionalLicense) {
        String normalized = normalizeText(professionalLicense);
        if (normalized == null) {
            return null;
        }
        return validateProfessionalLicense(normalized);
    }

    static List<String> validateConsultationTypes(List<String> consultationTypes, boolean required) {
        if (consultationTypes == null || consultationTypes.isEmpty()) {
            if (required) {
                throw new IllegalArgumentException("At least one consultation type is required.");
            }
            return List.of();
        }
        return normalizeAndValidateList(consultationTypes, CONSULTATION_TYPES, 3, 20, "Consultation type");
    }

    static String validatePhone(String phone) {
        String normalized = normalizeDigits(phone);
        if (normalized == null) {
            return null;
        }
        if (normalized.length() != 10) {
            throw new IllegalArgumentException("Phone number must contain exactly 10 digits.");
        }
        return normalized;
    }

    static String validatePostalCode(String postalCode) {
        String normalized = normalizeDigits(postalCode);
        if (normalized == null) {
            throw new IllegalArgumentException("Postal code is required.");
        }
        if (normalized.length() != 5) {
            throw new IllegalArgumentException("Postal code must contain exactly 5 digits.");
        }
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

    static String validateBio(String bio) {
        return validateRequiredText(bio, 500, "Bio");
    }

    static String validateOptionalBio(String bio) {
        return validateOptionalText(bio, 500, "Bio");
    }

    static String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        return normalized.isEmpty() ? null : normalized;
    }

    private static String normalizeDigits(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        if (!DIGITS_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Value must contain only digits.");
        }
        return normalized;
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

    private static String validateAllowedValue(
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

    private static List<String> normalizeAndValidateList(
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

    private static List<String> normalizeAndValidateFreeTextList(
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

    static List<WeightRecord> normalizeWeightHistory(List<WeightRecord> weightHistory, Double currentWeightKg) {
        if (weightHistory == null || weightHistory.isEmpty()) {
            if (currentWeightKg == null) {
                return new ArrayList<>();
            }
            return new ArrayList<>(List.of(new WeightRecord(currentWeightKg, LocalDate.now())));
        }
        return new ArrayList<>(weightHistory.stream().filter(Objects::nonNull).toList());
    }
}
