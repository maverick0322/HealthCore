package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ActivityLevel;
import com.healthcore.clinical.domain.model.Gender;
import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

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
            profile.getActivityLevel().name()
        );

        repository.save(document);

        return profile;
    }

    @Override
    public Optional<PatientProfile> findByUserId(String userId) {
        return repository.findById(userId)
            .map(doc -> new PatientProfile(
                doc.getUserId(),
                doc.getWeightKg(),
                doc.getHeightCm(),
                doc.getBirthDate(),
                Gender.valueOf(doc.getGender()), 
                ActivityLevel.valueOf(doc.getActivityLevel())
            ));
    }
}