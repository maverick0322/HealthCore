package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;

@Document(collection = "healthcore_clinical_profiles")
public class PatientProfileDocument {

    @Id
    private String userId;
    private Double weightKg;
    private Double heightCm;
    private LocalDate birthDate;
    private String gender; 
    private String activityLevel;

    public PatientProfileDocument() {}

    public PatientProfileDocument(String userId, Double weightKg, Double heightCm, LocalDate birthDate, String gender, String activityLevel) {
        this.userId = userId;
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.birthDate = birthDate;
        this.gender = gender;
        this.activityLevel = activityLevel;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
    public Double getHeightCm() { return heightCm; }
    public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }
}