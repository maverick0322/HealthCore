package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataMongoPatientProfileRepository extends MongoRepository<PatientProfileDocument, String> {
}