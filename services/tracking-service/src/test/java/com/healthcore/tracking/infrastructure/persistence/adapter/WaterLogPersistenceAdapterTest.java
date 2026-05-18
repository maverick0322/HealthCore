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
        // Arrange
        WaterLog domainLog = WaterLog.builder()
                .id("uuid-123")
                .userId(VALID_USER_ID)
                .amountMl(250)
                .consumedAt(FIXED_DATE)
                .build();

        WaterLogDocument savedDocument = WaterLogDocument.builder()
                .id("uuid-123")
                .userId(VALID_USER_ID)
                .amountMl(250)
                .consumedAt(FIXED_DATE)
                .build();

        when(repository.save(any(WaterLogDocument.class))).thenReturn(savedDocument);

        // Act
        WaterLog result = adapter.save(domainLog);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("uuid-123");
        assertThat(result.getUserId()).isEqualTo(VALID_USER_ID);
        assertThat(result.getAmountMl()).isEqualTo(250);
        assertThat(result.getConsumedAt()).isEqualTo(FIXED_DATE);

        verify(repository, times(1)).save(any(WaterLogDocument.class));
    }

    @Test
    void save_WithNullWaterLog_ThrowsIllegalArgumentException() {
        // Act & Assert
        assertThatThrownBy(() -> adapter.save(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("WaterLog cannot be null for persistence");

        verifyNoInteractions(repository);
    }

    @Test
    void save_WhenMongoThrowsDataAccessException_ThrowsPersistenceException() {
        // Arrange
        WaterLog domainLog = WaterLog.builder().userId(VALID_USER_ID).amountMl(250).build();
        DataAccessException dbError = new DataAccessResourceFailureException("MongoDB connection dropped");

        when(repository.save(any(WaterLogDocument.class))).thenThrow(dbError);

        // Act & Assert
        assertThatThrownBy(() -> adapter.save(domainLog))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Database error occurred while persisting water log.")
                .hasCause(dbError);
    }

    @Test
    void save_WhenUnexpectedExceptionOccurs_ThrowsPersistenceException() {
        // Arrange
        WaterLog domainLog = WaterLog.builder().userId(VALID_USER_ID).amountMl(250).build();
        RuntimeException genericError = new RuntimeException("Something completely unexpected happened");

        when(repository.save(any(WaterLogDocument.class))).thenThrow(genericError);

        // Act & Assert
        assertThatThrownBy(() -> adapter.save(domainLog))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Unexpected error during water log persistence.")
                .hasCause(genericError);
    }


    @Test
    void getConsumedWaterBetween_WithValidParams_ReturnsAggregatedTotal() {
        // Arrange
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);

        when(repository.sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end)).thenReturn(1500);

        // Act
        Integer result = adapter.getConsumedWaterBetween(VALID_USER_ID, start, end);

        // Assert
        assertThat(result).isEqualTo(1500);
        verify(repository, times(1)).sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end);
    }

    @Test
    void getConsumedWaterBetween_WhenRepositoryReturnsNull_ReturnsZero() {
        // Arrange
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);

        when(repository.sumWaterAmountByUserIdAndDateRange(VALID_USER_ID, start, end)).thenReturn(null);

        // Act
        Integer result = adapter.getConsumedWaterBetween(VALID_USER_ID, start, end);

        // Assert
        assertThat(result).isEqualTo(0);
    }

    @Test
    void getConsumedWaterBetween_WithNullParams_ThrowsIllegalArgumentException() {
        // Act & Assert
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
        // Arrange
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);
        DataAccessException dbError = new DataAccessResourceFailureException("Timeout");

        when(repository.sumWaterAmountByUserIdAndDateRange(eq(VALID_USER_ID), any(), any())).thenThrow(dbError);

        // Act & Assert
        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, start, end))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Database error occurred while aggregating water logs.")
                .hasCause(dbError);
    }

    @Test
    void getConsumedWaterBetween_WhenUnexpectedExceptionOccurs_ThrowsPersistenceException() {
        // Arrange
        LocalDateTime start = FIXED_DATE.minusHours(5);
        LocalDateTime end = FIXED_DATE.plusHours(5);
        RuntimeException genericError = new RuntimeException("Memory overflow");

        when(repository.sumWaterAmountByUserIdAndDateRange(eq(VALID_USER_ID), any(), any())).thenThrow(genericError);

        // Act & Assert
        assertThatThrownBy(() -> adapter.getConsumedWaterBetween(VALID_USER_ID, start, end))
                .isInstanceOf(WaterLogPersistenceException.class)
                .hasMessage("Unexpected error during water aggregation.")
                .hasCause(genericError);
    }
}