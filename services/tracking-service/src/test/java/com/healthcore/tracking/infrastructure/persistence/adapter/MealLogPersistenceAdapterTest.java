package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.infrastructure.persistence.entity.MealItemDocument;
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
class MealLogPersistenceAdapterTest {

    @Mock
    private SpringDataMongoMealLogRepository repositoryMock;

    @InjectMocks
    private MealLogPersistenceAdapter adapter;

    @Captor
    private ArgumentCaptor<MealLogDocument> documentCaptor;

    @Test
    @DisplayName("Should correctly map Aggregate Root to nested Document, save, and map back to Domain")
    void save_Success() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();

        MealItem domainItem = MealItem.builder()
                .barcode("123")
                .foodName("Manzana")
                .consumedGrams(100)
                .calories(52.0)
                .fiberGrams(2.4)
                .build();

        MealLog domainLog = MealLog.builder()
                .userId("user-1")
                .mealType(MealType.BREAKFAST)
                .photoKey("apple-photo.jpg")
                .consumedAt(now)
                .totalCalories(52.0)
                .items(List.of(domainItem))
                .build();

        MealItemDocument docItem = MealItemDocument.builder()
                .barcode("123")
                .foodName("Manzana")
                .consumedGrams(100)
                .calories(52.0)
                .fiberGrams(2.4)
                .build();

        MealLogDocument savedDocument = MealLogDocument.builder()
                .id("mongo-uuid-999")
                .userId("user-1")
                .mealType(MealType.BREAKFAST)
                .photoKey("apple-photo.jpg")
                .consumedAt(now)
                .totalCalories(52.0)
                .items(List.of(docItem))
                .build();

        when(repositoryMock.save(any(MealLogDocument.class))).thenReturn(savedDocument);

        // Act
        MealLog result = adapter.save(domainLog);

        // Assert - Check the mapped result returned to the Domain
        assertNotNull(result);
        assertEquals("mongo-uuid-999", result.getId());
        assertEquals("user-1", result.getUserId());
        assertEquals(1, result.getItems().size());
        assertEquals("Manzana", result.getItems().get(0).getFoodName());

        // Assert - Verify the internal translation to MongoDB Document
        verify(repositoryMock).save(documentCaptor.capture());
        MealLogDocument capturedDoc = documentCaptor.getValue();

        assertEquals(MealType.BREAKFAST, capturedDoc.getMealType());
        assertEquals("apple-photo.jpg", capturedDoc.getPhotoKey());
        assertEquals(1, capturedDoc.getItems().size());
        assertEquals(2.4, capturedDoc.getItems().get(0).getFiberGrams());
    }

    @Test
    @DisplayName("Should correctly map a list of Documents with embedded items to Domain models")
    void findByUserIdAndDateRange_Success() {
        // Arrange
        String userId = "user-1";
        LocalDateTime start = LocalDateTime.now().minusDays(1);
        LocalDateTime end = LocalDateTime.now();

        MealItemDocument docItem1 = MealItemDocument.builder().foodName("Plátano").build();
        MealLogDocument doc1 = MealLogDocument.builder()
                .id("doc-1")
                .mealType(MealType.SNACK)
                .items(List.of(docItem1))
                .build();

        MealItemDocument docItem2 = MealItemDocument.builder().foodName("Avena").build();
        MealLogDocument doc2 = MealLogDocument.builder()
                .id("doc-2")
                .mealType(MealType.BREAKFAST)
                .items(List.of(docItem2))
                .build();

        when(repositoryMock.findByUserIdAndConsumedAtBetween(userId, start, end))
                .thenReturn(List.of(doc1, doc2));

        // Act
        List<MealLog> results = adapter.findByUserIdAndDateRange(userId, start, end);

        // Assert
        assertEquals(2, results.size());

        // Assert first document
        assertEquals("doc-1", results.get(0).getId());
        assertEquals(MealType.SNACK, results.get(0).getMealType());
        assertEquals("Plátano", results.get(0).getItems().get(0).getFoodName());

        // Assert second document
        assertEquals("doc-2", results.get(1).getId());
        assertEquals(MealType.BREAKFAST, results.get(1).getMealType());
        assertEquals("Avena", results.get(1).getItems().get(0).getFoodName());

        verify(repositoryMock, times(1)).findByUserIdAndConsumedAtBetween(userId, start, end);
    }
}