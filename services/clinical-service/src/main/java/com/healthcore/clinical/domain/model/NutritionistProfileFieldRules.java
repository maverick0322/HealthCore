package com.healthcore.clinical.domain.model;

import java.util.List;
import java.util.Set;

final class NutritionistProfileFieldRules {

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

    private NutritionistProfileFieldRules() {
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

        List<String> normalized = ProfileTextRules.normalizeAndValidateList(
                specializations,
                NUTRITIONIST_SPECIALIZATIONS,
                3,
                30,
                "Specialization"
        );

        if (normalized.contains("OTHER") && ProfileTextRules.normalizeText(customSpecialization) == null) {
            throw new IllegalArgumentException("Custom specialization is required when OTHER is selected.");
        }
        return normalized;
    }

    static String validateCustomSpecialization(String customSpecialization) {
        return ProfileTextRules.validateOptionalText(customSpecialization, 60, "Custom specialization");
    }

    static String validateProfessionalLicense(String professionalLicense) {
        String normalized = ProfileTextRules.normalizeText(professionalLicense);
        if (normalized == null) {
            throw new IllegalArgumentException("Professional license is required.");
        }
        if (!normalized.chars().allMatch(Character::isDigit)) {
            throw new IllegalArgumentException("Professional license must contain only digits.");
        }
        if (normalized.length() < 7 || normalized.length() > 10) {
            throw new IllegalArgumentException("Professional license must contain between 7 and 10 digits.");
        }
        return normalized;
    }

    static String validateOptionalProfessionalLicense(String professionalLicense) {
        String normalized = ProfileTextRules.normalizeText(professionalLicense);
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
        return ProfileTextRules.normalizeAndValidateList(consultationTypes, CONSULTATION_TYPES, 3, 20, "Consultation type");
    }

    static String validatePhone(String phone) {
        String normalized = ProfileTextRules.normalizeDigits(phone);
        if (normalized == null) {
            return null;
        }
        if (normalized.length() != 10) {
            throw new IllegalArgumentException("Phone number must contain exactly 10 digits.");
        }
        return normalized;
    }

    static String validatePostalCode(String postalCode) {
        String normalized = ProfileTextRules.normalizeDigits(postalCode);
        if (normalized == null) {
            throw new IllegalArgumentException("Postal code is required.");
        }
        if (normalized.length() != 5) {
            throw new IllegalArgumentException("Postal code must contain exactly 5 digits.");
        }
        return normalized;
    }

    static String validateBio(String bio) {
        return ProfileTextRules.validateRequiredText(bio, 500, "Bio");
    }

    static String validateOptionalBio(String bio) {
        return ProfileTextRules.validateOptionalText(bio, 500, "Bio");
    }
}
