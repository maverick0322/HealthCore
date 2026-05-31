package com.healthcore.clinical.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Set;

final class PatientProfileFieldRules {

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

    private PatientProfileFieldRules() {
    }

    static LocalDate validateBirthDate(LocalDate birthDate) {
        if (birthDate == null) {
            throw new IllegalArgumentException("Birth date is required.");
        }
        LocalDate today = ClinicalTime.today();
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

    static LocalDate validateWeightRecordDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("Weight record date is required.");
        }
        if (date.isAfter(ClinicalTime.today())) {
            throw new IllegalArgumentException("Weight record date cannot be in the future.");
        }
        return date;
    }

    static String validatePatientGoal(String goal, boolean required) {
        return ProfileTextRules.validateAllowedValue(goal, PATIENT_GOALS, required, "Goal");
    }

    static String validateDietType(String dietType, boolean required) {
        return ProfileTextRules.validateAllowedValue(dietType, DIET_TYPES, required, "Diet type");
    }

    static List<String> validateAllergies(List<String> allergies) {
        if (allergies == null) {
            return List.of();
        }
        return ProfileTextRules.normalizeAndValidateList(allergies, ALLERGY_TYPES, 5, 20, "Allergy");
    }

    static List<String> validateExcludedFoods(List<String> excludedFoods) {
        if (excludedFoods == null) {
            return List.of();
        }
        return ProfileTextRules.normalizeAndValidateFreeTextList(excludedFoods, 15, 40, "Excluded food");
    }

    static List<WeightRecord> normalizeWeightHistory(List<WeightRecord> weightHistory, Double currentWeightKg) {
        if (weightHistory == null || weightHistory.isEmpty()) {
            if (currentWeightKg == null) {
                return new ArrayList<>();
            }
            return new ArrayList<>(List.of(new WeightRecord(currentWeightKg, ClinicalTime.today())));
        }
        LinkedHashMap<LocalDate, WeightRecord> deduplicatedByDate = new LinkedHashMap<>();
        weightHistory.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(WeightRecord::date))
                .forEach(record -> {
                    LocalDate validatedDate = validateWeightRecordDate(record.date());
                    deduplicatedByDate.put(
                            validatedDate,
                            new WeightRecord(validateWeightKg(record.weightKg()), validatedDate)
                    );
                });
        return new ArrayList<>(deduplicatedByDate.values());
    }
}
