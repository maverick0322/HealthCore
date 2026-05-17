package com.healthcore.clinical.domain.model;

import java.util.List;
import java.util.StringJoiner;

public class NutritionistProfile {

    private final String userId;
    private String firstName;
    private String paternalLastName;
    private String maternalLastName;
    private List<String> specializations;
    private String customSpecialization;
    private String professionalLicense;
    private List<String> consultationTypes;
    private String phone;
    private ClinicAddress clinicAddress;
    private String bio;

    public NutritionistProfile(
            String userId,
            String firstName,
            String paternalLastName,
            String maternalLastName,
            List<String> specializations,
            String customSpecialization,
            String professionalLicense,
            List<String> consultationTypes,
            String phone,
            ClinicAddress clinicAddress,
            String bio
    ) {
        this.userId = ProfileFieldValidator.requireUserId(userId);
        applyValidatedData(
                firstName,
                paternalLastName,
                maternalLastName,
                specializations,
                customSpecialization,
                professionalLicense,
                consultationTypes,
                phone,
                clinicAddress,
                bio
        );
    }

    public static NutritionistProfile rehydrate(
            String userId,
            String firstName,
            String paternalLastName,
            String maternalLastName,
            List<String> specializations,
            String customSpecialization,
            String professionalLicense,
            List<String> consultationTypes,
            String phone,
            ClinicAddress clinicAddress,
            String bio
    ) {
        NutritionistProfile profile = new NutritionistProfile(
                userId,
                "Temp",
                "Temp",
                null,
                List.of("OTHER"),
                "Temp",
                "1234567",
                List.of("ONLINE"),
                null,
                null,
                "Temp"
        );
        profile.firstName = ProfileFieldValidator.validateOptionalName(firstName, "First name");
        profile.paternalLastName = ProfileFieldValidator.validateOptionalName(paternalLastName, "Paternal last name");
        profile.maternalLastName = ProfileFieldValidator.validateOptionalName(maternalLastName, "Maternal last name");
        profile.specializations = ProfileFieldValidator.validateSpecializations(specializations, customSpecialization, false);
        profile.customSpecialization = ProfileFieldValidator.validateCustomSpecialization(customSpecialization);
        profile.professionalLicense = ProfileFieldValidator.validateOptionalProfessionalLicense(professionalLicense);
        profile.consultationTypes = ProfileFieldValidator.validateConsultationTypes(consultationTypes, false);
        profile.phone = ProfileFieldValidator.validatePhone(phone);
        profile.clinicAddress = clinicAddress;
        profile.bio = ProfileFieldValidator.validateOptionalBio(bio);
        return profile;
    }

    public void updateProfile(
            String firstName,
            String paternalLastName,
            String maternalLastName,
            List<String> specializations,
            String customSpecialization,
            String professionalLicense,
            List<String> consultationTypes,
            String phone,
            ClinicAddress clinicAddress,
            String bio
    ) {
        applyValidatedData(
                firstName,
                paternalLastName,
                maternalLastName,
                specializations,
                customSpecialization,
                professionalLicense,
                consultationTypes,
                phone,
                clinicAddress,
                bio
        );
    }

    private void applyValidatedData(
            String firstName,
            String paternalLastName,
            String maternalLastName,
            List<String> specializations,
            String customSpecialization,
            String professionalLicense,
            List<String> consultationTypes,
            String phone,
            ClinicAddress clinicAddress,
            String bio
    ) {
        this.firstName = ProfileFieldValidator.validateRequiredName(firstName, "First name");
        this.paternalLastName = ProfileFieldValidator.validateRequiredName(paternalLastName, "Paternal last name");
        this.maternalLastName = ProfileFieldValidator.validateOptionalName(maternalLastName, "Maternal last name");
        this.customSpecialization = ProfileFieldValidator.validateCustomSpecialization(customSpecialization);
        this.specializations = ProfileFieldValidator.validateSpecializations(specializations, this.customSpecialization, true);
        this.professionalLicense = ProfileFieldValidator.validateProfessionalLicense(professionalLicense);
        this.consultationTypes = ProfileFieldValidator.validateConsultationTypes(consultationTypes, true);
        this.phone = ProfileFieldValidator.validatePhone(phone);
        this.clinicAddress = clinicAddress;
        this.bio = ProfileFieldValidator.validateBio(bio);
    }

    public boolean isProfileCompleted() {
        return firstName != null
                && paternalLastName != null
                && specializations != null
                && !specializations.isEmpty()
                && professionalLicense != null
                && consultationTypes != null
                && !consultationTypes.isEmpty()
                && bio != null;
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

    public List<String> getSpecializations() {
        return specializations;
    }

    public String getCustomSpecialization() {
        return customSpecialization;
    }

    public String getProfessionalLicense() {
        return professionalLicense;
    }

    public List<String> getConsultationTypes() {
        return consultationTypes;
    }

    public String getPhone() {
        return phone;
    }

    public ClinicAddress getClinicAddress() {
        return clinicAddress;
    }

    public String getBio() {
        return bio;
    }
}
