package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Component
public class MongoClinicalRepositoryAdapter implements ClinicalRepositoryPort {

    private final SpringDataMongoPatientProfileRepository repository;

    public MongoClinicalRepositoryAdapter(SpringDataMongoPatientProfileRepository repository) {
        this.repository = repository;
    }

    @Override
    public PatientProfile save(PatientProfile profile) {
        PatientProfileDocument document = new PatientProfileDocument(
            profile.getUserId(),
            profile.getWeightKg(),
            profile.getHeightCm(),
            profile.getBirthDate(),
            profile.getGender().name(), 
            profile.getActivityLevel().name(),
            profile.getWeightHistory() 
        );
        
        document.setNutritionistId(profile.getNutritionistId());

        repository.save(document);
        return profile;
    }

    @Override
    public Optional<PatientProfile> findByUserId(String userId) {
        return repository.findById(userId)
            .map(this::mapDocumentToDomain);
    }

    @Override
    public List<PatientProfile> findAllByNutritionistId(String nutritionistId) {
        return repository.findAllByNutritionistId(nutritionistId).stream()
                .map(this::mapDocumentToDomain)
                .collect(Collectors.toList());
    }

    private PatientProfile mapDocumentToDomain(PatientProfileDocument doc) {
        PatientProfile profile = new PatientProfile(
            doc.getUserId(),
            doc.getWeightKg(),
            doc.getHeightCm(),
            doc.getBirthDate(),
            Gender.valueOf(doc.getGender()), 
            ActivityLevel.valueOf(doc.getActivityLevel())
        );
        
        if (doc.getWeightHistory() != null && !doc.getWeightHistory().isEmpty()) {
            profile.getWeightHistory().clear();
            profile.getWeightHistory().addAll(doc.getWeightHistory());
        }
        
        profile.setNutritionistId(doc.getNutritionistId());
        
        return profile;
    }
}