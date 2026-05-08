package com.healthcore.clinical.domain.model;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

public class PatientProfile {
    private final String userId;
    private Double weightKg;
    private Double heightCm;
    private LocalDate birthDate;
    private Gender gender;
    private ActivityLevel activityLevel;
    private List<WeightRecord> weightHistory;
    private String nutritionistId;

    public PatientProfile(String userId, Double weightKg, Double heightCm, LocalDate birthDate, Gender gender, ActivityLevel activityLevel) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID cannot be null or empty");
        }
        this.userId = userId;
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.birthDate = birthDate;
        this.gender = gender;
        this.activityLevel = activityLevel;
        this.weightHistory = new ArrayList<>();
        this.weightHistory.add(new WeightRecord(weightKg, LocalDate.now()));
    }

    public HealthGoal updateWeight(Double newWeight) {
        this.weightKg = newWeight;
        this.weightHistory.add(new WeightRecord(newWeight, LocalDate.now()));
        return generateHealthGoals();
    }

    public HealthGoal generateHealthGoals() {
        double tmb = calculateTMB();
        double tdee = tmb * activityLevel.getMultiplier();

        int targetCalories = (int) Math.round(tdee);
        int targetProtein = (int) Math.round((tdee * 0.30) / 4.0);
        int targetCarbs = (int) Math.round((tdee * 0.40) / 4.0);
        int targetFat = (int) Math.round((tdee * 0.30) / 9.0);

        return new HealthGoal(targetCalories, targetProtein, targetCarbs, targetFat);
    }

    public void assignNutritionist(String nutritionistId) {
        if (this.nutritionistId != null) {
            throw new IllegalStateException("El paciente ya tiene un nutriólogo asignado.");
        }
        this.nutritionistId = nutritionistId;
    }

    public void removeNutritionist() {
        this.nutritionistId = null;
    }

    private double calculateTMB() {
        int age = Period.between(this.birthDate, LocalDate.now()).getYears();
        double baseMifflin = (10 * this.weightKg) + (6.25 * this.heightCm) - (5 * age);
        
        return this.gender == Gender.MALE 
            ? baseMifflin + 5 
            : baseMifflin - 161;
    }

    public String getUserId() { return userId; }
    public Double getWeightKg() { return weightKg; }
    public Double getHeightCm() { return heightCm; }
    public LocalDate getBirthDate() { return birthDate; }
    public Gender getGender() { return gender; }
    public ActivityLevel getActivityLevel() { return activityLevel; }
    public List<WeightRecord> getWeightHistory() { return weightHistory; } 
    public String getNutritionistId() { return nutritionistId; }

    public void setNutritionistId(String nutritionistId) {
        this.nutritionistId = nutritionistId;
    }
}