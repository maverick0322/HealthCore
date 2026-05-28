package com.healthcore.tracking.infrastructure.persistence.adapter;

import com.healthcore.tracking.domain.model.WaterLog;
import com.healthcore.tracking.infrastructure.persistence.entity.WaterLogDocument;
import com.healthcore.tracking.infrastructure.persistence.exception.WaterLogPersistenceException;
import com.healthcore.tracking.infrastructure.persistence.repository.SpringDataMongoWaterLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaterLogPersistenceAdapterTest {

    @Mock
    private SpringDataMongoWaterLogRepository repository;

    @InjectMocks
    private WaterLogPersistenceAdapter adapter;

    private static final String VALID_USER_ID = "user-123";
    private static final LocalDateTime FIXED_DATE = LocalDateTime.of(2026, 5, 17, 10, 30);

    @Test
    void save_WithValidWaterLog_MapsToDocumentSavesAndReturnsDomain() {
        WaterLog domainLog = WaterLog.builder()
                .id("uuid-123")
                .userId(VALID_USER_ID)
                .amountMl(250)
                .consumedAt(FIXED_DATE)
                .build();

        // FIX: Usamos un mock en lugar del builder de Lombok para evitar errores de visibilidad
        WaterLogDocument savedDocument = mock(WaterLogDocument.class);
        when(savedDocument.getId()).thenReturn("uuid-123");
        when(savedDocument.getUserId()).thenReturn(VALID_USER_ID);
        when(savedDocument.getAmountMl()).thenReturn(250);
        when(savedDocument.getConsumedAt()).thenReturn(FIXED_DATE);

        when(repository.save(any(WaterLogDocument.class))).thenReturn(savedDocument);

        WaterLog result = adapter.save(domainLog);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("uuid-123");
        assertThat(result.getUserId()).isEqualTo(VALID_USER_ID);
        assertThat(result.getAmountMl()).isEqualTo(250);
        assertThat(result.getConsumedAt()).isEqualTo(FIXED_DATE);

        verify(repository, times(1)).save(any(WaterLogDocument.class));
    }

    @Test
    void save_WithNullWaterLog_ThrowsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.save(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("WaterLog cannot be null for persistence");

        verifyNoInteractions(repository);
    }

    @Test
    void save_WhenMongoThrowsDataAccessException_ThrowsPersistenceException() {
        WaterLog domainLog = WaterLog.builder().userId(VALID_USER_ID).amountMl(250).build();
        DataAccessException dbError = new DataAccessResourceFailureException("MongoDB connection dropped");

        when(repository.save(any(WaterLogDocument.class))).thenThrow(dbError);

        assertThatThrownBy(() -> adapter.save(domainLog))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Database error occurred while persisting water log.")
                .hasCause(dbError);
    }

    @Test
    void save_WhenUnexpectedExceptionOccurs_ThrowsPersistenceException() {
        WaterLog domainLog = WaterLog.builder().userId(VALID_USER_ID).amountMl(250).build();
        RuntimeException genericError = new RuntimeException("Something completely unexpected happened");

        when(repository.save(any(WaterLogDocument.class))).thenThrow(genericError);

        assertThatThrownBy(() -> adapter.save(domainLog))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Unexpected error during water log persistence.")
                .hasCause(genericError);
    }

    @Test
    void getConsumedWaterBetween_WithValidParams_ReturnsAggregatedTotal() {
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);

        when(repository.sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end)).thenReturn(1500);

        Integer result = adapter.getConsumedWaterBetween(VALID_USER_ID, start, end);

        assertThat(result).isEqualTo(1500);
        verify(repository, times(1)).sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end);
    }

    @Test
    void getConsumedWaterBetween_WhenRepositoryReturnsNull_ReturnsZero() {
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);

        when(repository.sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end)).thenReturn(null);

        Integer result = adapter.getConsumedWaterBetween(VALID_USER_ID, start, end);

        assertThat(result).isEqualTo(0);
    }

    @Test
    void getConsumedWaterBetween_WithNullParams_ThrowsIllegalArgumentException() {
        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(null, FIXED_DATE, FIXED_DATE))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, null, FIXED_DATE))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, FIXED_DATE, null))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(repository);
    }

    @Test
    void getConsumedWaterBetween_WhenMongoThrowsDataAccessException_ThrowsPersistenceException() {
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);
        DataAccessException dbError = new DataAccessResourceFailureException("Timeout");

        when(repository.sumWaterAmountByUserIdAndDateRange(eq(VALID_USER_ID), any(), any())).thenThrow(dbError);

        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, start, end))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Database error occurred while aggregating water logs.")
                .hasCause(dbError);
    }

    @Test
    void getConsumedWaterBetween_WhenUnexpectedExceptionOccurs_ThrowsPersistenceException() {
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);
        RuntimeException genericError = new RuntimeException("Memory overflow");

        when(repository.sumWaterAmountByUserIdAndDateRange(eq(VALID_USER_ID), any(), any())).thenThrow(genericError);

        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, start, end))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Unexpected error during water aggregation.")
                .hasCause(genericError);
    }

    @Test
    void deleteLatest_Success() {
        WaterLogDocument mockDoc = mock(WaterLogDocument.class);

        when(repository.findFirstByUserIdAndConsumedAtBetweenOrderByConsumedAtDesc(anyString(), any(), any()))
                .thenReturn(Optional.of(mockDoc));

        adapter.deleteLatest("user-123", LocalDateTime.now(), LocalDateTime.now());

        verify(repository, times(1)).delete(mockDoc);
    }
}