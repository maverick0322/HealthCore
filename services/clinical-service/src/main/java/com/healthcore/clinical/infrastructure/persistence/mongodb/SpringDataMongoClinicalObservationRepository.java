package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpringDataMongoClinicalObservationRepository extends MongoRepository<ClinicalObservationDocument, String> {
    
    List<ClinicalObservationDocument> findByPatientIdOrderByCreatedAtDesc(String patientId);
}