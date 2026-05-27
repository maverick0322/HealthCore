package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "healthcore_nutritionist_profiles")
public class NutritionistProfileDocument {

    @Id
    private String userId;
    private String firstName;
    private String paternalLastName;
    private String maternalLastName;
    private List<String> specializations;
    private String customSpecialization;
    private String professionalLicense;
    private List<String> consultationTypes;
    private String phone;
    private ClinicAddressDocument clinicAddress;
    private String bio;
    private String profilePhotoKey;

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

    public List<String> getSpecializations() {
        return specializations;
    }

    public void setSpecializations(List<String> specializations) {
        this.specializations = specializations;
    }

    public String getCustomSpecialization() {
        return customSpecialization;
    }

    public void setCustomSpecialization(String customSpecialization) {
        this.customSpecialization = customSpecialization;
    }

    public String getProfessionalLicense() {
        return professionalLicense;
    }

    public void setProfessionalLicense(String professionalLicense) {
        this.professionalLicense = professionalLicense;
    }

    public List<String> getConsultationTypes() {
        return consultationTypes;
    }

    public void setConsultationTypes(List<String> consultationTypes) {
        this.consultationTypes = consultationTypes;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public ClinicAddressDocument getClinicAddress() {
        return clinicAddress;
    }

    public void setClinicAddress(ClinicAddressDocument clinicAddress) {
        this.clinicAddress = clinicAddress;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getProfilePhotoKey() {
        return profilePhotoKey;
    }

    public void setProfilePhotoKey(String profilePhotoKey) {
        this.profilePhotoKey = profilePhotoKey;
    }
}
