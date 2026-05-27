package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class MongoClinicalRepositoryAdapter implements ClinicalRepositoryPort {

    private final SpringDataMongoPatientProfileRepository patientRepository;

    public MongoClinicalRepositoryAdapter(SpringDataMongoPatientProfileRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public PatientProfile save(PatientProfile profile) {
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

        patientRepository.save(document);
        return profile;
    }

    @Override
    public Optional<PatientProfile> findByUserId(String userId) {
        return patientRepository.findById(userId).map(this::mapPatientDocumentToDomain);
    }

    @Override
    public List<PatientProfile> findAllByNutritionistId(String nutritionistId) {
        return patientRepository.findAllByNutritionistId(nutritionistId)
                .stream()
                .map(this::mapPatientDocumentToDomain)
                .toList();
    }

    private PatientProfile mapPatientDocumentToDomain(PatientProfileDocument doc) {
        return PatientProfile.rehydrate(
                doc.getUserId(),
                doc.getFirstName(),
                doc.getPaternalLastName(),
                doc.getMaternalLastName(),
                doc.getWeightKg(),
                doc.getHeightCm(),
                doc.getBirthDate(),
                doc.getGender() != null ? Gender.valueOf(doc.getGender()) : null,
                doc.getActivityLevel() != null ? ActivityLevel.valueOf(doc.getActivityLevel()) : null,
                doc.getGoal(),
                doc.getDietType(),
                doc.getAllergies(),
                doc.getExcludedFoods(),
                doc.getWeightHistory(),
                doc.getNutritionistId(),
                doc.getProfilePhotoKey()
        );
    }
}
