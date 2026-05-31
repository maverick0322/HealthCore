package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import org.springframework.stereotype.Component;

@Component
public class PatientProfileMongoMapper {

    public PatientProfileDocument toDocument(PatientProfile profile) {
        PatientProfileDocument document = new PatientProfileDocument();
        document.setUserId(profile.getUserId());
        document.setFirstName(profile.getFirstName());
        document.setPaternalLastName(profile.getPaternalLastName());
        document.setMaternalLastName(profile.getMaternalLastName());
        document.setWeightKg(profile.getWeightKg());
        document.setHeightCm(profile.getHeightCm());
        document.setBirthDate(profile.getBirthDate());
        document.setGender(profile.getGender() != null ? profile.getGender().name() : null);
        document.setActivityLevel(profile.getActivityLevel() != null ? profile.getActivityLevel().name() : null);
        document.setGoal(profile.getGoal());
        document.setDietType(profile.getDietType());
        document.setAllergies(profile.getAllergies());
        document.setExcludedFoods(profile.getExcludedFoods());
        document.setWeightHistory(profile.getWeightHistory());
        document.setNutritionistId(profile.getNutritionistId());
        document.setProfilePhotoKey(profile.getProfilePhotoKey());
        return document;
    }

    public PatientProfile toDomain(PatientProfileDocument document) {
        return PatientProfile.rehydrate(
                document.getUserId(),
                document.getFirstName(),
                document.getPaternalLastName(),
                document.getMaternalLastName(),
                document.getWeightKg(),
                document.getHeightCm(),
                document.getBirthDate(),
                document.getGender() != null ? Gender.valueOf(document.getGender()) : null,
                document.getActivityLevel() != null ? ActivityLevel.valueOf(document.getActivityLevel()) : null,
                document.getGoal(),
                document.getDietType(),
                document.getAllergies(),
                document.getExcludedFoods(),
                document.getWeightHistory(),
                document.getNutritionistId(),
                document.getProfilePhotoKey()
        );
    }
}
