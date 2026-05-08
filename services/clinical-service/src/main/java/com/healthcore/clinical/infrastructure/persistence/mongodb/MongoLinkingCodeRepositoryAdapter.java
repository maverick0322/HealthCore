package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.LinkingCode;
import com.healthcore.clinical.domain.port.out.LinkingCodeRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class MongoLinkingCodeRepositoryAdapter implements LinkingCodeRepositoryPort {

    private final SpringDataMongoLinkingCodeRepository repository;

    public MongoLinkingCodeRepositoryAdapter(SpringDataMongoLinkingCodeRepository repository) {
        this.repository = repository;
    }

    @Override
    public LinkingCode save(LinkingCode linkingCode) {
        LinkingCodeDocument doc = new LinkingCodeDocument(
                linkingCode.getCode(),
                linkingCode.getNutritionistId(),
                linkingCode.getCreatedAt()
        );
        LinkingCodeDocument savedDoc = repository.save(doc);
        return toDomain(savedDoc);
    }

    @Override
    public Optional<LinkingCode> findByCode(String code) {
        return repository.findById(code).map(this::toDomain);
    }

    @Override
    public Optional<LinkingCode> findByNutritionistId(String nutritionistId) {
        return repository.findByNutritionistId(nutritionistId).map(this::toDomain);
    }

    @Override
    public void deleteByCode(String code) {
        repository.deleteById(code);
    }

    private LinkingCode toDomain(LinkingCodeDocument doc) {
        return new LinkingCode(doc.getCode(), doc.getNutritionistId(), doc.getCreatedAt());
    }
}