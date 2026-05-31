package com.healthcore.clinical.infrastructure.persistence.mongodb;

import com.healthcore.clinical.domain.model.LinkingCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MongoLinkingCodeRepositoryAdapterTest {

    @Mock
    private SpringDataMongoLinkingCodeRepository repository;

    @Test
    void shouldMapLinkingCodeToDocumentWhenSaving() {
        MongoLinkingCodeRepositoryAdapter adapter = new MongoLinkingCodeRepositoryAdapter(repository);
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 30, 10, 0);
        LinkingCode linkingCode = new LinkingCode("ABC123", "nutri-1", createdAt);
        LinkingCodeDocument savedDocument = new LinkingCodeDocument("ABC123", "nutri-1", createdAt);

        when(repository.save(any(LinkingCodeDocument.class))).thenReturn(savedDocument);

        LinkingCode result = adapter.save(linkingCode);

        assertNotNull(result);
        assertEquals("ABC123", result.getCode());
        assertEquals("nutri-1", result.getNutritionistId());
        assertEquals(createdAt, result.getCreatedAt());
    }

    @Test
    void shouldMapRepositoryDocumentWhenFindingByCode() {
        MongoLinkingCodeRepositoryAdapter adapter = new MongoLinkingCodeRepositoryAdapter(repository);
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 30, 10, 0);

        when(repository.findById("ABC123")).thenReturn(Optional.of(
                new LinkingCodeDocument("ABC123", "nutri-1", createdAt)
        ));

        Optional<LinkingCode> result = adapter.findByCode("ABC123");

        assertEquals("ABC123", result.orElseThrow().getCode());
        assertEquals("nutri-1", result.orElseThrow().getNutritionistId());
        assertEquals(createdAt, result.orElseThrow().getCreatedAt());
    }

    @Test
    void shouldReturnMostRecentCodeWhenFindingByNutritionistId() {
        MongoLinkingCodeRepositoryAdapter adapter = new MongoLinkingCodeRepositoryAdapter(repository);
        LinkingCodeDocument older = new LinkingCodeDocument("OLD111", "nutri-1", LocalDateTime.of(2026, 5, 30, 9, 0));
        LinkingCodeDocument latest = new LinkingCodeDocument("NEW222", "nutri-1", LocalDateTime.of(2026, 5, 30, 11, 0));

        when(repository.findByNutritionistId("nutri-1")).thenReturn(List.of(older, latest));

        Optional<LinkingCode> result = adapter.findByNutritionistId("nutri-1");

        assertEquals("NEW222", result.orElseThrow().getCode());
        assertEquals("nutri-1", result.orElseThrow().getNutritionistId());
    }

    @Test
    void shouldReturnEmptyWhenNutritionistHasNoCodes() {
        MongoLinkingCodeRepositoryAdapter adapter = new MongoLinkingCodeRepositoryAdapter(repository);

        when(repository.findByNutritionistId("nutri-1")).thenReturn(List.of());

        Optional<LinkingCode> result = adapter.findByNutritionistId("nutri-1");

        assertFalse(result.isPresent());
    }

    @Test
    void shouldDelegateDeleteOperationsToRepository() {
        MongoLinkingCodeRepositoryAdapter adapter = new MongoLinkingCodeRepositoryAdapter(repository);

        adapter.deleteByCode("ABC123");
        adapter.deleteByNutritionistId("nutri-1");

        verify(repository).deleteById("ABC123");
        verify(repository).deleteByNutritionistId("nutri-1");
    }
}
