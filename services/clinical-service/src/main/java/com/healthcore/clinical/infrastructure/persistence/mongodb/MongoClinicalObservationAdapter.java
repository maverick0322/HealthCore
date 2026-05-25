package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicalObservation;
import com.healthcore.clinical.domain.port.out.ClinicalObservationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class MongoClinicalObservationAdapter implements ClinicalObservationRepositoryPort {

    private final SpringDataMongoClinicalObservationRepository repository;

    public MongoClinicalObservationAdapter(SpringDataMongoClinicalObservationRepository repository) {
        this.repository = repository;
    }

    @Override
    public ClinicalObservation save(ClinicalObservation observation) {
        ClinicalObservationDocument document = toDocument(observation);
        ClinicalObservationDocument savedDocument = repository.save(document);
        return toDomain(savedDocument);
    }

    @Override
    public List<ClinicalObservation> findAllByPatientId(String patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<ClinicalObservation> findById(String observationId) {
        return repository.findById(observationId).map(this::toDomain);
    }

    @Override
    public void deleteById(String observationId) {
        repository.deleteById(observationId);
    }

    @Override
    public void deleteAllByPatientId(String patientId) {
        repository.deleteAllByPatientId(patientId);
    }

    private ClinicalObservationDocument toDocument(ClinicalObservation domain) {
        if (domain == null) return null;
        return new ClinicalObservationDocument(
                domain.getId(),
                domain.getPatientId(),
                domain.getNutritionistId(),
                domain.getNote(),
                domain.getCreatedAt()
        );
    }

    private ClinicalObservation toDomain(ClinicalObservationDocument document) {
        if (document == null) return null;
        return new ClinicalObservation(
                document.getId(),
                document.getPatientId(),
                document.getNutritionistId(),
                document.getNote(),
                document.getCreatedAt()
        );
    }
}
