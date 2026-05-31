package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.PatientProfile;
import com.healthcore.clinical.domain.port.out.ClinicalRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class MongoClinicalRepositoryAdapter implements ClinicalRepositoryPort {

    private final SpringDataMongoPatientProfileRepository patientRepository;
    private final PatientProfileMongoMapper patientProfileMongoMapper;

    public MongoClinicalRepositoryAdapter(
            SpringDataMongoPatientProfileRepository patientRepository,
            PatientProfileMongoMapper patientProfileMongoMapper
    ) {
        this.patientRepository = patientRepository;
        this.patientProfileMongoMapper = patientProfileMongoMapper;
    }

    @Override
    public PatientProfile save(PatientProfile profile) {
        patientRepository.save(patientProfileMongoMapper.toDocument(profile));
        return profile;
    }

    @Override
    public Optional<PatientProfile> findByUserId(String userId) {
        return patientRepository.findById(userId).map(patientProfileMongoMapper::toDomain);
    }

    @Override
    public List<PatientProfile> findAllByNutritionistId(String nutritionistId) {
        return patientRepository.findAllByNutritionistId(nutritionistId)
                .stream()
                .map(patientProfileMongoMapper::toDomain)
                .toList();
    }
}
