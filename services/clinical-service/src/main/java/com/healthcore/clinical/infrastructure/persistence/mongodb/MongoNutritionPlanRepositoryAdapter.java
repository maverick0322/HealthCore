package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.AuthorType;
import com.healthcore.clinical.domain.model.NutritionPlan;
import com.healthcore.clinical.domain.model.PlanStatus;
import com.healthcore.clinical.domain.port.out.NutritionPlanRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class MongoNutritionPlanRepositoryAdapter implements NutritionPlanRepositoryPort {

    private final SpringDataMongoNutritionPlanRepository repository;
    private final NutritionPlanMongoMapper nutritionPlanMongoMapper;

    public MongoNutritionPlanRepositoryAdapter(
            SpringDataMongoNutritionPlanRepository repository,
            NutritionPlanMongoMapper nutritionPlanMongoMapper
    ) {
        this.repository = repository;
        this.nutritionPlanMongoMapper = nutritionPlanMongoMapper;
    }

    @Override
    public NutritionPlan save(NutritionPlan nutritionPlan) {
        repository.save(nutritionPlanMongoMapper.toDocument(nutritionPlan));
        return nutritionPlan;
    }

    @Override
    public Optional<NutritionPlan> findActiveByPatientIdAndAuthorType(String patientId, AuthorType authorType) {
        return repository.findFirstByPatientIdAndAuthorTypeAndStatusOrderByUpdatedAtDesc(
                patientId,
                authorType.name(),
                PlanStatus.ACTIVE.name()
        ).map(nutritionPlanMongoMapper::toDomain);
    }

    @Override
    public Optional<NutritionPlan> findActiveByPatientIdAndAuthorTypeAndAuthorId(
            String patientId,
            AuthorType authorType,
            String authorId
    ) {
        return repository.findFirstByPatientIdAndAuthorTypeAndAuthorIdAndStatusOrderByUpdatedAtDesc(
                patientId,
                authorType.name(),
                authorId,
                PlanStatus.ACTIVE.name()
        ).map(nutritionPlanMongoMapper::toDomain);
    }

    @Override
    public Optional<NutritionPlan> findLatestByPatientIdAndAuthorType(String patientId, AuthorType authorType) {
        return repository.findFirstByPatientIdAndAuthorTypeOrderByUpdatedAtDesc(
                patientId,
                authorType.name()
        ).map(nutritionPlanMongoMapper::toDomain);
    }

    @Override
    public List<NutritionPlan> findActiveByPatientId(String patientId) {
        return repository.findAllByPatientIdAndStatus(patientId, PlanStatus.ACTIVE.name())
                .stream()
                .map(nutritionPlanMongoMapper::toDomain)
                .toList();
    }
}
