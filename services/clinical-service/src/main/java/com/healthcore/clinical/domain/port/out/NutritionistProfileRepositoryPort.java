package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.NutritionistProfile;

import java.util.Optional;

public interface NutritionistProfileRepositoryPort {
    NutritionistProfile save(NutritionistProfile profile);
    Optional<NutritionistProfile> findByUserId(String userId);
}
