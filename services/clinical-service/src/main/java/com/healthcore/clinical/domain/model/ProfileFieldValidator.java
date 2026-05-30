package com.healthcore.clinical.domain.model;

import java.time.LocalDate;
import java.util.List;

final class ProfileFieldValidator {

    private ProfileFieldValidator() {
    }

    static String requireUserId(String userId) {
        return ProfileTextRules.requireUserId(userId);
    }

    static String validateRequiredName(String value, String fieldName) {
        return ProfileTextRules.validateRequiredName(value, fieldName);
    }

    static String validateOptionalName(String value, String fieldName) {
        return ProfileTextRules.validateOptionalName(value, fieldName);
    }

    static LocalDate validateBirthDate(LocalDate birthDate) {
        return PatientProfileFieldRules.validateBirthDate(birthDate);
    }

    static LocalDate validateOptionalBirthDate(LocalDate birthDate) {
        return PatientProfileFieldRules.validateOptionalBirthDate(birthDate);
    }

    static Double validateHeightCm(Double heightCm) {
        return PatientProfileFieldRules.validateHeightCm(heightCm);
    }

    static Double validateOptionalHeightCm(Double heightCm) {
        return PatientProfileFieldRules.validateOptionalHeightCm(heightCm);
    }

    static Double validateWeightKg(Double weightKg) {
        return PatientProfileFieldRules.validateWeightKg(weightKg);
    }

    static Double validateOptionalWeightKg(Double weightKg) {
        return PatientProfileFieldRules.validateOptionalWeightKg(weightKg);
    }

    static LocalDate validateWeightRecordDate(LocalDate date) {
        return PatientProfileFieldRules.validateWeightRecordDate(date);
    }

    static String validatePatientGoal(String goal, boolean required) {
        return PatientProfileFieldRules.validatePatientGoal(goal, required);
    }

    static String validateDietType(String dietType, boolean required) {
        return PatientProfileFieldRules.validateDietType(dietType, required);
    }

    static List<String> validateAllergies(List<String> allergies) {
        return PatientProfileFieldRules.validateAllergies(allergies);
    }

    static List<String> validateExcludedFoods(List<String> excludedFoods) {
        return PatientProfileFieldRules.validateExcludedFoods(excludedFoods);
    }

    static List<String> validateSpecializations(
            List<String> specializations,
            String customSpecialization,
            boolean required
    ) {
        return NutritionistProfileFieldRules.validateSpecializations(specializations, customSpecialization, required);
    }

    static String validateCustomSpecialization(String customSpecialization) {
        return NutritionistProfileFieldRules.validateCustomSpecialization(customSpecialization);
    }

    static String validateProfessionalLicense(String professionalLicense) {
        return NutritionistProfileFieldRules.validateProfessionalLicense(professionalLicense);
    }

    static String validateOptionalProfessionalLicense(String professionalLicense) {
        return NutritionistProfileFieldRules.validateOptionalProfessionalLicense(professionalLicense);
    }

    static List<String> validateConsultationTypes(List<String> consultationTypes, boolean required) {
        return NutritionistProfileFieldRules.validateConsultationTypes(consultationTypes, required);
    }

    static String validatePhone(String phone) {
        return NutritionistProfileFieldRules.validatePhone(phone);
    }

    static String validatePostalCode(String postalCode) {
        return NutritionistProfileFieldRules.validatePostalCode(postalCode);
    }

    static String validateRequiredText(String value, int maxLength, String fieldName) {
        return ProfileTextRules.validateRequiredText(value, maxLength, fieldName);
    }

    static String validateOptionalText(String value, int maxLength, String fieldName) {
        return ProfileTextRules.validateOptionalText(value, maxLength, fieldName);
    }

    static String validateBio(String bio) {
        return NutritionistProfileFieldRules.validateBio(bio);
    }

    static String validateOptionalBio(String bio) {
        return NutritionistProfileFieldRules.validateOptionalBio(bio);
    }

    static String normalizeText(String value) {
        return ProfileTextRules.normalizeText(value);
    }

    static List<WeightRecord> normalizeWeightHistory(List<WeightRecord> weightHistory, Double currentWeightKg) {
        return PatientProfileFieldRules.normalizeWeightHistory(weightHistory, currentWeightKg);
    }
}
