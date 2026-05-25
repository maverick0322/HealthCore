package com.healthcore.clinical.domain.model;

import java.time.LocalDate;
import java.time.Period;
import java.util.Comparator;
import java.util.List;
import java.util.StringJoiner;

public class PatientProfile {
    private final String userId;
    private String firstName;
    private String paternalLastName;
    private String maternalLastName;
    private Double weightKg;
    private Double heightCm;
    private LocalDate birthDate;
    private Gender gender;
    private ActivityLevel activityLevel;
    private String goal;
    private String dietType;
    private List<String> allergies;
    private List<String> excludedFoods;
    private List<WeightRecord> weightHistory;
    private String nutritionistId;

    public PatientProfile(
            String userId,
            String firstName,
            String paternalLastName,
            String maternalLastName,
            Double weightKg,
            Double heightCm,
            LocalDate birthDate,
            Gender gender,
            ActivityLevel activityLevel,
            String goal,
            String dietType,
            List<String> allergies,
            List<String> excludedFoods
    ) {
        this.userId = ProfileFieldValidator.requireUserId(userId);
        applyValidatedData(
                firstName,
                paternalLastName,
                maternalLastName,
                weightKg,
                heightCm,
                birthDate,
                gender,
                activityLevel,
                goal,
                dietType,
                allergies,
                excludedFoods
        );
        this.weightHistory = ProfileFieldValidator.normalizeWeightHistory(null, this.weightKg);
    }

    public static PatientProfile rehydrate(
            String userId,
            String firstName,
            String paternalLastName,
            String maternalLastName,
            Double weightKg,
            Double heightCm,
            LocalDate birthDate,
            Gender gender,
            ActivityLevel activityLevel,
            String goal,
            String dietType,
            List<String> allergies,
            List<String> excludedFoods,
            List<WeightRecord> weightHistory,
            String nutritionistId
    ) {
        PatientProfile profile = new PatientProfile(
                userId,
                "Temp",
                "Temp",
                null,
                70.0,
                170.0,
                ClinicalTime.today().minusYears(25),
                Gender.MALE,
                ActivityLevel.SEDENTARY,
                "health",
                "omnivore",
                List.of(),
                List.of()
        );
        profile.firstName = ProfileFieldValidator.validateOptionalName(firstName, "First name");
        profile.paternalLastName = ProfileFieldValidator.validateOptionalName(paternalLastName, "Paternal last name");
        profile.maternalLastName = ProfileFieldValidator.validateOptionalName(maternalLastName, "Maternal last name");
        profile.weightKg = ProfileFieldValidator.validateOptionalWeightKg(weightKg);
        profile.heightCm = ProfileFieldValidator.validateOptionalHeightCm(heightCm);
        profile.birthDate = ProfileFieldValidator.validateOptionalBirthDate(birthDate);
        profile.gender = gender;
        profile.activityLevel = activityLevel;
        profile.goal = ProfileFieldValidator.validatePatientGoal(goal, false);
        profile.dietType = ProfileFieldValidator.validateDietType(dietType, false);
        profile.allergies = ProfileFieldValidator.validateAllergies(allergies);
        profile.excludedFoods = ProfileFieldValidator.validateExcludedFoods(excludedFoods);
        profile.weightHistory = ProfileFieldValidator.normalizeWeightHistory(weightHistory, profile.weightKg);
        if (!profile.weightHistory.isEmpty()) {
            profile.weightKg = profile.weightHistory.get(profile.weightHistory.size() - 1).weightKg();
        }
        profile.nutritionistId = ProfileFieldValidator.normalizeText(nutritionistId);
        return profile;
    }

    public HealthGoal registerWeight(Double newWeight, LocalDate date) {
        Double validatedWeight = ProfileFieldValidator.validateWeightKg(newWeight);
        LocalDate validatedDate = ProfileFieldValidator.validateWeightRecordDate(date);

        this.weightHistory.removeIf(record -> record.date().equals(validatedDate));
        this.weightHistory.add(new WeightRecord(validatedWeight, validatedDate));
        this.weightHistory.sort(Comparator.comparing(WeightRecord::date));
        syncCurrentWeightFromHistory();
        return generateHealthGoals();
    }

    public HealthGoal editWeightRecord(LocalDate originalDate, Double newWeight, LocalDate newDate) {
        LocalDate validatedOriginalDate = ProfileFieldValidator.validateWeightRecordDate(originalDate);
        Double validatedWeight = ProfileFieldValidator.validateWeightKg(newWeight);
        LocalDate validatedNewDate = ProfileFieldValidator.validateWeightRecordDate(newDate);

        boolean originalRecordExists = this.weightHistory.stream()
                .anyMatch(record -> record.date().equals(validatedOriginalDate));
        if (!originalRecordExists) {
            throw new IllegalArgumentException("Weight record not found for the provided date.");
        }

        this.weightHistory.removeIf(record ->
                record.date().equals(validatedOriginalDate)
                        || (!validatedOriginalDate.equals(validatedNewDate) && record.date().equals(validatedNewDate))
        );
        this.weightHistory.add(new WeightRecord(validatedWeight, validatedNewDate));
        this.weightHistory.sort(Comparator.comparing(WeightRecord::date));
        syncCurrentWeightFromHistory();
        return generateHealthGoals();
    }

    public HealthGoal deleteWeightRecord(LocalDate date) {
        LocalDate validatedDate = ProfileFieldValidator.validateWeightRecordDate(date);

        if (this.weightHistory.size() <= 1) {
            throw new IllegalStateException("At least one weight record must remain in the profile.");
        }

        boolean removed = this.weightHistory.removeIf(record -> record.date().equals(validatedDate));
        if (!removed) {
            throw new IllegalArgumentException("Weight record not found for the provided date.");
        }

        this.weightHistory.sort(Comparator.comparing(WeightRecord::date));
        syncCurrentWeightFromHistory();
        return generateHealthGoals();
    }

    public void updateProfile(
            String firstName,
            String paternalLastName,
            String maternalLastName,
            Double weightKg,
            Double heightCm,
            LocalDate birthDate,
            Gender gender,
            ActivityLevel activityLevel,
            String goal,
            String dietType,
            List<String> allergies,
            List<String> excludedFoods
    ) {
        Double previousWeight = this.weightKg;
        applyValidatedData(
                firstName,
                paternalLastName,
                maternalLastName,
                weightKg,
                heightCm,
                birthDate,
                gender,
                activityLevel,
                goal,
                dietType,
                allergies,
                excludedFoods
        );
        if (previousWeight == null || Double.compare(previousWeight, this.weightKg) != 0) {
            registerWeight(this.weightKg, ClinicalTime.today());
        }
    }

    public HealthGoal generateHealthGoals() {
        if (!isProfileCompleted()) {
            throw new IllegalStateException("Patient profile is incomplete.");
        }
        double tmb = calculateTMB();
        double tdee = tmb * activityLevel.getMultiplier();

        int targetCalories = (int) Math.round(tdee);
        int targetProtein = (int) Math.round((tdee * 0.30) / 4.0);
        int targetCarbs = (int) Math.round((tdee * 0.40) / 4.0);
        int targetFat = (int) Math.round((tdee * 0.30) / 9.0);
        int targetWaterGlasses = (int) Math.ceil((this.weightKg * 35.0) / 250.0);

        return new HealthGoal(targetCalories, targetProtein, targetCarbs, targetFat, targetWaterGlasses);
    }

    public void assignNutritionist(String nutritionistId) {
        if (this.nutritionistId != null) {
            throw new IllegalStateException("El paciente ya tiene un nutriologo asignado.");
        }
        this.nutritionistId = ProfileFieldValidator.requireUserId(nutritionistId);
    }

    public void removeNutritionist() {
        this.nutritionistId = null;
    }

    private double calculateTMB() {
        int age = Period.between(this.birthDate, ClinicalTime.today()).getYears();
        double baseMifflin = (10 * this.weightKg) + (6.25 * this.heightCm) - (5 * age);

        return this.gender == Gender.MALE
                ? baseMifflin + 5
                : baseMifflin - 161;
    }

    private void applyValidatedData(
            String firstName,
            String paternalLastName,
            String maternalLastName,
            Double weightKg,
            Double heightCm,
            LocalDate birthDate,
            Gender gender,
            ActivityLevel activityLevel,
            String goal,
            String dietType,
            List<String> allergies,
            List<String> excludedFoods
    ) {
        this.firstName = ProfileFieldValidator.validateRequiredName(firstName, "First name");
        this.paternalLastName = ProfileFieldValidator.validateRequiredName(paternalLastName, "Paternal last name");
        this.maternalLastName = ProfileFieldValidator.validateOptionalName(maternalLastName, "Maternal last name");
        this.weightKg = ProfileFieldValidator.validateWeightKg(weightKg);
        this.heightCm = ProfileFieldValidator.validateHeightCm(heightCm);
        this.birthDate = ProfileFieldValidator.validateBirthDate(birthDate);
        if (gender == null) {
            throw new IllegalArgumentException("Gender is required.");
        }
        if (activityLevel == null) {
            throw new IllegalArgumentException("Activity level is required.");
        }
        this.gender = gender;
        this.activityLevel = activityLevel;
        this.goal = ProfileFieldValidator.validatePatientGoal(goal, true);
        this.dietType = ProfileFieldValidator.validateDietType(dietType, true);
        this.allergies = ProfileFieldValidator.validateAllergies(allergies);
        this.excludedFoods = ProfileFieldValidator.validateExcludedFoods(excludedFoods);
    }

    private void syncCurrentWeightFromHistory() {
        if (this.weightHistory == null || this.weightHistory.isEmpty()) {
            throw new IllegalStateException("Weight history cannot be empty.");
        }
        this.weightKg = this.weightHistory.get(this.weightHistory.size() - 1).weightKg();
    }

    public boolean isProfileCompleted() {
        return firstName != null
                && paternalLastName != null
                && weightKg != null
                && heightCm != null
                && birthDate != null
                && gender != null
                && activityLevel != null
                && goal != null
                && dietType != null;
    }

    public String getFullName() {
        StringJoiner joiner = new StringJoiner(" ");
        if (firstName != null) {
            joiner.add(firstName);
        }
        if (paternalLastName != null) {
            joiner.add(paternalLastName);
        }
        if (maternalLastName != null) {
            joiner.add(maternalLastName);
        }
        String fullName = joiner.toString().trim();
        return fullName.isEmpty() ? null : fullName;
    }

    public String getUserId() {
        return userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getPaternalLastName() {
        return paternalLastName;
    }

    public String getMaternalLastName() {
        return maternalLastName;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public Gender getGender() {
        return gender;
    }

    public ActivityLevel getActivityLevel() {
        return activityLevel;
    }

    public String getGoal() {
        return goal;
    }

    public String getDietType() {
        return dietType;
    }

    public List<String> getAllergies() {
        return allergies;
    }

    public List<String> getExcludedFoods() {
        return excludedFoods;
    }

    public List<WeightRecord> getWeightHistory() {
        return weightHistory;
    }

    public String getNutritionistId() {
        return nutritionistId;
    }

    public void setNutritionistId(String nutritionistId) {
        this.nutritionistId = ProfileFieldValidator.normalizeText(nutritionistId);
    }
}
