package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.ClinicAddress;
import com.healthcore.clinical.domain.model.NutritionistProfile;
import com.healthcore.clinical.domain.port.out.NutritionistProfileRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class MongoNutritionistProfileRepositoryAdapter implements NutritionistProfileRepositoryPort {

    private final SpringDataMongoNutritionistProfileRepository nutritionistRepository;
    private final NutritionistProfileMongoMapper nutritionistProfileMongoMapper;

    public MongoNutritionistProfileRepositoryAdapter(
            SpringDataMongoNutritionistProfileRepository nutritionistRepository,
            NutritionistProfileMongoMapper nutritionistProfileMongoMapper
    ) {
        this.nutritionistRepository = nutritionistRepository;
        this.nutritionistProfileMongoMapper = nutritionistProfileMongoMapper;
    }

    @Override
    public NutritionistProfile save(NutritionistProfile profile) {
        nutritionistRepository.save(nutritionistProfileMongoMapper.toDocument(profile));
        return profile;
    }

    @Override
    public Optional<NutritionistProfile> findByUserId(String userId) {
        return nutritionistRepository.findById(userId).map(nutritionistProfileMongoMapper::toDomain);
    }
}
