package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.DailyMacroSummary;
import com.healthcore.tracking.domain.model.MealItem;
import com.healthcore.tracking.domain.model.MealLog;
import com.healthcore.tracking.domain.model.MealType;
import com.healthcore.tracking.infrastructure.persistence.entity.MealItemDocument;
import com.healthcore.tracking.infrastructure.persistence.entity.MealLogDocument;
import com.healthcore.tracking.infrastructure.persistence.exception.MealLogPersistenceException;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoMealLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MealLogPersistenceAdapterTest {

    @Mock
    private SpringDataMongoMealLogRepository repositoryMock;

    @Mock
    private MongoTemplate mongoTemplate; // NUEVO: Necesario para los queries nativos

    @InjectMocks
    private MealLogPersistenceAdapter adapter;

    @Captor
    private ArgumentCaptor<MealLogDocument> documentCaptor;

    // --- PRUEBAS ORIGINALES INTACTAS ---

    @Test
    @DisplayName("Should correctly map Aggregate Root to nested Document, save, and map back to Domain")
    void save_Success() {
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

        MealLog result = adapter.save(domainLog);

        assertNotNull(result);
        assertEquals("mongo-uuid-999", result.getId());
        assertEquals("user-1", result.getUserId());
        assertEquals(1, result.getItems().size());
        assertEquals("Manzana", result.getItems().get(0).getFoodName());

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

        List<MealLog> results = adapter.findByUserIdAndDateRange(userId, start, end);

        assertEquals(2, results.size());
        assertEquals("doc-1", results.get(0).getId());
        assertEquals(MealType.SNACK, results.get(0).getMealType());
        assertEquals("Plátano", results.get(0).getItems().get(0).getFoodName());

        assertEquals("doc-2", results.get(1).getId());
        assertEquals(MealType.BREAKFAST, results.get(1).getMealType());
        assertEquals("Avena", results.get(1).getItems().get(0).getFoodName());

        verify(repositoryMock, times(1)).findByUserIdAndConsumedAtBetween(userId, start, end);
    }

    // --- NUEVAS PRUEBAS PARA 100% COVERAGE ---

    // 1. Escudo de Retrocompatibilidad (Rama True)
    @Test
    @DisplayName("toDomain should keep original mealName if it is explicitly saved in the DB")
    void findByUserIdAndDateRange_WithExplicitMealName_KeepsMealName() {
        LocalDateTime now = LocalDateTime.now();
        MealLogDocument doc = MealLogDocument.builder()
                .id("doc-1")
                .mealType(MealType.LUNCH)
                .mealName("Mi Ensalada Verde") // Este nombre explícito debe respetarse
                .items(List.of())
                .build();

        when(repositoryMock.findByUserIdAndConsumedAtBetween(anyString(), any(), any()))
                .thenReturn(List.of(doc));

        List<MealLog> results = adapter.findByUserIdAndDateRange("user-1", now, now);
        assertEquals("Mi Ensalada Verde", results.get(0).getMealName());
    }

    // 2. Errores y Nulos en save()
    @Test
    void save_WithNullLog_ThrowsException() {
        assertThatThrownBy(() -> adapter.save(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void save_WhenMongoThrowsDataAccessException_ThrowsPersistenceException() {
        MealLog log = MealLog.builder().userId("user-1").items(List.of()).build();
        DataAccessException dbError = new DataAccessResourceFailureException("DB down");
        when(repositoryMock.save(any())).thenThrow(dbError);

        assertThatThrownBy(() -> adapter.save(log))
                .isInstanceOf(MealLogPersistenceException.class)
                .hasCause(dbError);
    }

    @Test
    void save_WhenGenericException_ThrowsPersistenceException() {
        MealLog log = MealLog.builder().userId("user-1").items(List.of()).build();
        when(repositoryMock.save(any())).thenThrow(new RuntimeException("Oops"));

        assertThatThrownBy(() -> adapter.save(log))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    // 3. Errores y Nulos en findByUserIdAndDateRange()
    @Test
    void findByUserIdAndDateRange_WithNullParams_ThrowsException() {
        LocalDateTime now = LocalDateTime.now();
        assertThatThrownBy(() -> adapter.findByUserIdAndDateRange(null, now, now))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> adapter.findByUserIdAndDateRange("user-1", null, now))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> adapter.findByUserIdAndDateRange("user-1", now, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void findByUserIdAndDateRange_WhenMongoThrowsException_ThrowsPersistenceException() {
        LocalDateTime now = LocalDateTime.now();
        when(repositoryMock.findByUserIdAndConsumedAtBetween(anyString(), any(), any()))
                .thenThrow(new DataAccessResourceFailureException("DB down"));

        assertThatThrownBy(() -> adapter.findByUserIdAndDateRange("user-1", now, now))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    @Test
    void findByUserIdAndDateRange_WhenGenericException_ThrowsPersistenceException() {
        LocalDateTime now = LocalDateTime.now();
        when(repositoryMock.findByUserIdAndConsumedAtBetween(anyString(), any(), any()))
                .thenThrow(new RuntimeException("Oops"));

        assertThatThrownBy(() -> adapter.findByUserIdAndDateRange("user-1", now, now))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    // 4. aggregateHistoricalMacros() - Éxito y Errores
    @Test
    void aggregateHistoricalMacros_Success() {
        LocalDateTime now = LocalDateTime.now();
        DailyMacroSummary summary = new DailyMacroSummary("2026-05-17", 100.0, 10.0, 10.0, 10.0);

        when(repositoryMock.aggregateHistoricalMacros("user-1", now, now))
                .thenReturn(List.of(summary));

        List<DailyMacroSummary> result = adapter.aggregateHistoricalMacros("user-1", now, now);
        assertEquals(1, result.size());
        assertEquals("2026-05-17", result.get(0).date());
    }

    @Test
    void aggregateHistoricalMacros_WithNullParams_ThrowsException() {
        LocalDateTime now = LocalDateTime.now();
        assertThatThrownBy(() -> adapter.aggregateHistoricalMacros(null, now, now))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void aggregateHistoricalMacros_WhenMongoThrowsException_ThrowsPersistenceException() {
        LocalDateTime now = LocalDateTime.now();
        when(repositoryMock.aggregateHistoricalMacros(anyString(), any(), any()))
                .thenThrow(new DataAccessResourceFailureException("DB down"));

        assertThatThrownBy(() -> adapter.aggregateHistoricalMacros("user-1", now, now))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    @Test
    void aggregateHistoricalMacros_WhenGenericException_ThrowsPersistenceException() {
        LocalDateTime now = LocalDateTime.now();
        when(repositoryMock.aggregateHistoricalMacros(anyString(), any(), any()))
                .thenThrow(new RuntimeException("Oops"));

        assertThatThrownBy(() -> adapter.aggregateHistoricalMacros("user-1", now, now))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    // 5. findDistinctLoggedDatesByUserId() - Éxito y Errores
    @Test
    void findDistinctLoggedDatesByUserId_Success_FiltersNulls() {
        LocalDateTime date1 = LocalDateTime.of(2026, 5, 17, 10, 0);
        LocalDateTime date2 = LocalDateTime.of(2026, 5, 18, 15, 30);

        // CORRECCIÓN: Usamos Arrays.asList porque List.of no permite valores nulos en Java
        when(mongoTemplate.findDistinct(any(Query.class), eq("consumedAt"), eq(MealLogDocument.class), eq(LocalDateTime.class)))
                .thenReturn(java.util.Arrays.asList(date1, date2, null));

        Set<LocalDate> result = adapter.findDistinctLoggedDatesByUserId("user-1");

        assertEquals(2, result.size());
        assertTrue(result.contains(LocalDate.of(2026, 5, 17)));
        assertTrue(result.contains(LocalDate.of(2026, 5, 18)));
    }

    @Test
    void findDistinctLoggedDatesByUserId_WithNullUserId_ThrowsException() {
        assertThatThrownBy(() -> adapter.findDistinctLoggedDatesByUserId(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> adapter.findDistinctLoggedDatesByUserId("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void findDistinctLoggedDatesByUserId_WhenMongoThrowsException_ThrowsPersistenceException() {
        // CORRECCIÓN: Usamos any(Class.class) para eliminar la ambigüedad del compilador
        when(mongoTemplate.findDistinct(any(Query.class), anyString(), any(Class.class), any(Class.class)))
                .thenThrow(new DataAccessResourceFailureException("DB down"));

        assertThatThrownBy(() -> adapter.findDistinctLoggedDatesByUserId("user-1"))
                .isInstanceOf(MealLogPersistenceException.class);
    }

    @Test
    void findDistinctLoggedDatesByUserId_WhenGenericException_ThrowsPersistenceException() {
        // CORRECCIÓN: Usamos any(Class.class) para eliminar la ambigüedad del compilador
        when(mongoTemplate.findDistinct(any(Query.class), anyString(), any(Class.class), any(Class.class)))
                .thenThrow(new RuntimeException("Oops"));

        assertThatThrownBy(() -> adapter.findDistinctLoggedDatesByUserId("user-1"))
                .isInstanceOf(MealLogPersistenceException.class);
    }
}