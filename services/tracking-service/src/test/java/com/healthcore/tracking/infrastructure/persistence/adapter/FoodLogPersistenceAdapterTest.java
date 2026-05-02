package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoMealLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodLogPersistenceAdapterTest {

    @Mock
    private SpringDataMongoMealLogRepository repositoryMock;

    @InjectMocks
    private FoodLogPersistenceAdapter adapter;

    @Captor
    private ArgumentCaptor<MealLogDocument> documentCaptor;

    @Test
    @DisplayName("Should correctly map Domain to Document, save, and map back to Domain")
    void save_Success() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        FoodLog domainLog = FoodLog.builder()
                .userId("user-1")
                .barcode("123")
                .foodName("Manzana")
                .consumedGrams(100)
                .totalCalories(52)
                .consumedAt(now)
                .build();

        MealLogDocument savedDocument = MealLogDocument.builder()
                .id("mongo-uuid-999")
                .userId("user-1")
                .barcode("123")
                .foodName("Manzana")
                .consumedGrams(100)
                .totalCalories(52)
                .consumedAt(now)
                .build();

        when(repositoryMock.save(any(MealLogDocument.class))).thenReturn(savedDocument);

        // Act
        FoodLog result = adapter.save(domainLog);

        // Assert
        assertNotNull(result);
        assertEquals("mongo-uuid-999", result.getId());
        assertEquals("user-1", result.getUserId());

        verify(repositoryMock).save(documentCaptor.capture());
        MealLogDocument capturedDoc = documentCaptor.getValue();

        assertEquals("Manzana", capturedDoc.getFoodName());
        assertEquals(52.0, capturedDoc.getTotalCalories());
    }

    @Test
    @DisplayName("Should correctly map a list of Documents to Domain models")
    void findByUserIdAndDateRange_Success() {
        // Arrange
        String userId = "user-1";
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now();

        MealLogDocument doc1 = MealLogDocument.builder().id("doc-1").foodName("Plátano").build();
        MealLogDocument doc2 = MealLogDocument.builder().id("doc-2").foodName("Avena").build();

        when(repositoryMock.findByUserIdAndConsumedAtBetween(userId, start, end))
                .thenReturn(List.of(doc1, doc2));

        // Act
        List<FoodLog> results = adapter.findByUserIdAndDateRange(userId, start, end);

        // Assert
        assertEquals(2, results.size());
        assertEquals("doc-1", results.get(0).getId());
        assertEquals("Plátano", results.get(0).getFoodName());
        assertEquals("Avena", results.get(1).getFoodName());

        verify(repositoryMock, times(1)).findByUserIdAndConsumedAtBetween(userId, start, end);
    }
}