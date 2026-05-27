package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.WeightRecord;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Document(collection = "healthcore_clinical_profiles")
public class PatientProfileDocument {

    @Id
    private String userId;
    private String firstName;
    private String paternalLastName;
    private String maternalLastName;
    private Double weightKg;
    private Double heightCm;
    private LocalDate birthDate;
    private String gender;
    private String activityLevel;
    private String goal;
    private String dietType;
    private List<String> allergies;
    private List<String> excludedFoods;
    private List<WeightRecord> weightHistory;
    private String nutritionistId;
    private String profilePhotoKey;

    public PatientProfileDocument() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getPaternalLastName() {
        return paternalLastName;
    }

    public void setPaternalLastName(String paternalLastName) {
        this.paternalLastName = paternalLastName;
    }

    public String getMaternalLastName() {
        return maternalLastName;
    }

    public void setMaternalLastName(String maternalLastName) {
        this.maternalLastName = maternalLastName;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public Double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(Double heightCm) {
        this.heightCm = heightCm;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getActivityLevel() {
        return activityLevel;
    }

    public void setActivityLevel(String activityLevel) {
        this.activityLevel = activityLevel;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public String getDietType() {
        return dietType;
    }

    public void setDietType(String dietType) {
        this.dietType = dietType;
    }

    public List<String> getAllergies() {
        return allergies;
    }

    public void setAllergies(List<String> allergies) {
        this.allergies = allergies;
    }

    public List<String> getExcludedFoods() {
        return excludedFoods;
    }

    public void setExcludedFoods(List<String> excludedFoods) {
        this.excludedFoods = excludedFoods;
    }

    public List<WeightRecord> getWeightHistory() {
        return weightHistory;
    }

    public void setWeightHistory(List<WeightRecord> weightHistory) {
        this.weightHistory = weightHistory;
    }

    public String getNutritionistId() {
        return nutritionistId;
    }

    public void setNutritionistId(String nutritionistId) {
        this.nutritionistId = nutritionistId;
    }

    public String getProfilePhotoKey() {
        return profilePhotoKey;
    }

    public void setProfilePhotoKey(String profilePhotoKey) {
        this.profilePhotoKey = profilePhotoKey;
    }
}
