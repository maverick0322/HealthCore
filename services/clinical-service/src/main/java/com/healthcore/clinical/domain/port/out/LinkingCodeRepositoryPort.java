package com.healthcore.clinical.domain.port.out;

import com.healthcore.clinical.domain.model.LinkingCode;
import java.util.Optional;

public interface LinkingCodeRepositoryPort {
    LinkingCode save(LinkingCode linkingCode);
    Optional<LinkingCode> findByCode(String code);
    Optional<LinkingCode> findByNutritionistId(String nutritionistId);
    void deleteByCode(String code);
    void deleteByNutritionistId(String nutritionistId);
}
