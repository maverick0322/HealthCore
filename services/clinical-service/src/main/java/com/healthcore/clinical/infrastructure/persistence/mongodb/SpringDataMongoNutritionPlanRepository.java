package com.healthcore.clinical.infrastructure.persistence.mongodb;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataMongoNutritionPlanRepository extends MongoRepository<NutritionPlanDocument, String> {
    Optional<NutritionPlanDocument> findFirstByPatientIdAndAuthorTypeAndStatusOrderByUpdatedAtDesc(
            String patientId,
            String authorType,
            String status
    );

    Optional<NutritionPlanDocument> findFirstByPatientIdAndAuthorTypeAndAuthorIdAndStatusOrderByUpdatedAtDesc(
            String patientId,
            String authorType,
            String authorId,
            String status
    );

    Optional<NutritionPlanDocument> findFirstByPatientIdAndAuthorTypeOrderByUpdatedAtDesc(
            String patientId,
            String authorType
    );

    List<NutritionPlanDocument> findAllByPatientIdAndStatus(String patientId, String status);
}
